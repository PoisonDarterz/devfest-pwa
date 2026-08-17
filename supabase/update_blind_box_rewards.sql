-- =============================================================================
-- GOOGLE DEVFEST KL 2026 - BLIND BOX REWARD SYSTEM UPDATE MIGRATION
-- Adds drop weights, odds/probabilities, inventory locks, and atomic Gacha draws.
-- Execute this script in your Supabase SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENHANCE REWARDS TABLE (Add Odds/Probability Weights & Rarity Tiers)
-- -----------------------------------------------------------------------------
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS drop_weight INT NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'Common', -- 'Common', 'Rare', 'Epic', 'Legendary'
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- -----------------------------------------------------------------------------
-- 2. CREATE BLIND BOXES CONFIGURATION TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blind_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    required_stamps INT NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert Default Blind Box Config
INSERT INTO public.blind_boxes (name, description, required_stamps) VALUES
('GDGKL Mystery Blind Box', 'Collect 5 booth stamps to open the mystery swag box!', 5)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. SEED BLIND BOX REWARDS WITH PROBABILITIES & QUANTITIES
-- -----------------------------------------------------------------------------
-- Higher drop_weight = Higher chance of winning.
-- Drop Rate % = (drop_weight / SUM(all active drop_weights)) * 100
INSERT INTO public.rewards (title, subtitle, required_stamps, total_quantity, remaining_quantity, drop_weight, rarity) VALUES
('7 days Free Gemini Pro', 'Valid until 31/12/2026. First come first served basis.', 5, 200, 200, 50, 'Common'),    -- ~50% Drop Rate
('DevFest KL 2026 Sticker Pack', 'High quality vinyl stickers featuring Dino & Android.', 5, 150, 150, 30, 'Common'),    -- ~30% Drop Rate
('GDGKL Collector Badge', 'Limited edition metal enamel pin.', 5, 50, 50, 12, 'Rare'),                             -- ~12% Drop Rate
('GDGKL Exclusive T-Shirt', 'Official DevFest 2026 developer tee.', 5, 20, 20, 6, 'Epic'),                          -- ~6% Drop Rate
('Grand Prize: Google Pixel Buds Pro', 'Active Noise Cancellation Wireless Earbuds.', 5, 2, 2, 2, 'Legendary')      -- ~2% Drop Rate
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. ATOMIC GACHA DRAW STORED PROCEDURE (Race-Condition & Inventory Safe)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.draw_blind_box_reward(
    p_user_id UUID,
    p_required_stamps INT DEFAULT 5
)
RETURNS TABLE (
    success BOOLEAN,
    reward_id UUID,
    title TEXT,
    subtitle TEXT,
    rarity TEXT,
    remaining_quantity INT,
    message TEXT
) AS $$
DECLARE
    v_stamp_count INT;
    v_total_weight INT;
    v_random_val FLOAT;
    v_cum_weight INT := 0;
    v_selected_reward RECORD;
    v_updated_remaining INT;
BEGIN
    -- 1. Check user stamp count
    SELECT COUNT(*) INTO v_stamp_count 
    FROM public.user_stamps 
    WHERE user_id = p_user_id;

    IF v_stamp_count < p_required_stamps THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 0, 
            'Not enough stamps! You need at least ' || p_required_stamps || ' stamps.';
        RETURN;
    END IF;

    -- 2. Check if user already drew a reward for this draw tier
    IF EXISTS (SELECT 1 FROM public.user_redemptions WHERE user_id = p_user_id) THEN
        -- Optional: Allow 1 draw per 5 stamps or check redemption limit
    END IF;

    -- 3. Calculate total weight of available active rewards with inventory > 0
    SELECT COALESCE(SUM(r.drop_weight), 0) INTO v_total_weight
    FROM public.rewards r
    WHERE r.is_active = TRUE AND r.remaining_quantity > 0;

    IF v_total_weight = 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 0, 
            'All blind box rewards are currently out of stock!';
        RETURN;
    END IF;

    -- 4. Pick random value between 0 and total weight
    v_random_val := random() * v_total_weight;

    -- 5. Iterate through weighted pool to select winner
    FOR v_selected_reward IN 
        SELECT r.id, r.title, r.subtitle, r.rarity, r.drop_weight, r.remaining_quantity
        FROM public.rewards r
        WHERE r.is_active = TRUE AND r.remaining_quantity > 0
        ORDER BY r.drop_weight ASC
    LOOP
        v_cum_weight := v_cum_weight + v_selected_reward.drop_weight;
        IF v_random_val <= v_cum_weight THEN
            -- Winner found! Attempt atomic inventory decrement
            UPDATE public.rewards
            SET remaining_quantity = remaining_quantity - 1
            WHERE id = v_selected_reward.id AND remaining_quantity > 0
            RETURNING remaining_quantity INTO v_updated_remaining;

            IF FOUND THEN
                -- Record redemption in audit table
                INSERT INTO public.user_redemptions (user_id, reward_id, redeemed_at)
                VALUES (p_user_id, v_selected_reward.id, NOW());

                RETURN QUERY SELECT TRUE, v_selected_reward.id, v_selected_reward.title, 
                    v_selected_reward.subtitle, v_selected_reward.rarity, v_updated_remaining,
                    'Congratulations! You won: ' || v_selected_reward.title;
                RETURN;
              END IF;
        END IF;
    END LOOP;

    -- Fallback safety check
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 0, 
        'Could not complete draw. Please try again.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
