-- =============================================================================
-- GOOGLE DEVFEST KUALA LUMPUR 2026 - VERSATILE DATABASE SCHEMA
-- Versatile Ticket Validation (Ticket2u / Peatix / Custom CSV Email Whitelist)
-- Execute this SQL script in your Supabase SQL Editor or PostgreSQL Database.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TICKETING WHITELISTS TABLE (Platform-Agnostic Ticketed Email List)
-- Organizers import emails from Ticket2u, Peatix, or CSV exports.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticketing_whitelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    ticket_type TEXT NOT NULL DEFAULT 'Standard Attendee', -- 'VIP Attendee', 'Standard Attendee', 'Speaker', 'Organizer', 'Sponsor'
    external_ref_id TEXT, -- e.g. Ticket2u reference ID, Peatix order ID, or CSV row ID
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lowercased email matching during registration
CREATE INDEX IF NOT EXISTS idx_ticketing_whitelists_email ON public.ticketing_whitelists(LOWER(email));

-- -----------------------------------------------------------------------------
-- 2. USER PROFILES TABLE (Filled in by participant upon registration)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    company_role TEXT,
    bio TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    password_hash TEXT,
    nfc_token TEXT UNIQUE,
    ticket_type TEXT NOT NULL DEFAULT 'Standard Attendee',
    is_ticket_verified BOOLEAN DEFAULT false,
    is_checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    qr_payload TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for NFC token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nfc_token ON public.profiles(nfc_token);

-- -----------------------------------------------------------------------------
-- 3. EMAIL VALIDATION FUNCTION (RPC Endpoint for PWA Registration)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_registration_email(user_email TEXT)
RETURNS TABLE (
    is_whitelisted BOOLEAN,
    ticket_type TEXT,
    external_ref_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE AS is_whitelisted,
        tw.ticket_type,
        tw.external_ref_id
    FROM public.ticketing_whitelists tw
    WHERE LOWER(tw.email) = LOWER(user_email)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 4. SESSIONS TABLE (Conference Agenda & Timetable)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    speaker_name TEXT NOT NULL,
    speaker_role TEXT,
    speaker_avatar TEXT,
    track TEXT NOT NULL, -- 'AI / ML', 'Cloud & DevOps', 'Mobile & Flutter', 'Web & Chrome', 'Keynote'
    room TEXT NOT NULL,  -- 'Main Auditorium', 'Hall A (Tech Stage)', 'Hall B (Web Stage)'
    time TEXT NOT NULL,  -- e.g. '10:30 AM'
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4.1 USER SAVED SESSIONS TABLE (Conference Session Bookmarks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_saved_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    session_id TEXT NOT NULL,
    status TEXT DEFAULT 'attending',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_email, session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_sessions_email ON public.user_saved_sessions(LOWER(user_email));

-- -----------------------------------------------------------------------------
-- 11. NOTIFICATIONS TABLE (Push Alerts & Lucky Draw Broadcasts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'session_alert', -- 'session_alert', 'lucky_draw', 'organizer_announcement'
    target_track TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 11.1 USER NOTIFICATION READS TABLE (Tracks read state per user)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_email, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_reads ON public.user_notification_reads(LOWER(user_email));

-- -----------------------------------------------------------------------------
-- 5. BOOTHS TABLE (Sponsor & Partner Exhibition Booths)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Cloud', 'AI / ML', 'Mobile & Web', 'Community', 'Gold Sponsor', 'Platinum Sponsor'
    description TEXT,
    booth_code TEXT UNIQUE NOT NULL,
    logo_text TEXT,
    logo_url TEXT,
    points INT DEFAULT 15,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. USER STAMPS TABLE (Passport stamps collected by visiting booths)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_stamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, booth_id)
);

-- -----------------------------------------------------------------------------
-- 7. REWARDS TABLE (Blind Box Perks & Swag Catalogue with Drop Weights)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    required_stamps INT NOT NULL DEFAULT 5,
    total_quantity INT DEFAULT 100,
    remaining_quantity INT DEFAULT 100,
    drop_weight INT NOT NULL DEFAULT 10, -- Higher weight = higher drop chance
    rarity TEXT NOT NULL DEFAULT 'Common', -- 'Common', 'Rare', 'Epic', 'Legendary'
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. BLIND BOXES TABLE (Gacha Draw Configurations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blind_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    required_stamps INT NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 9. USER REDEMPTIONS TABLE (Reward redemption audit log)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 10. ATOMIC BLIND BOX GACHA DRAW STORED PROCEDURE (Odds & Stock Safe)
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

    -- 2. Calculate total weight of available active rewards with inventory > 0
    SELECT COALESCE(SUM(r.drop_weight), 0) INTO v_total_weight
    FROM public.rewards r
    WHERE r.is_active = TRUE AND r.remaining_quantity > 0;

    IF v_total_weight = 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 0, 
            'All blind box rewards are currently out of stock!';
        RETURN;
    END IF;

    -- 3. Pick random value between 0 and total weight
    v_random_val := random() * v_total_weight;

    -- 4. Iterate through weighted pool to select winner
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

    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 0, 
        'Could not complete draw. Please try again.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 9. CONNECTIONS TABLE (Friends added via QR scan or NFC bump)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    method TEXT NOT NULL DEFAULT 'QR Scan', -- 'NFC Bump', 'QR Scan', 'Direct Link'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

-- -----------------------------------------------------------------------------
-- 10. FAQS TABLE (Frequently Asked Questions & Venue Guide)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and policies for profiles & saved sessions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert to profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to profiles" ON public.profiles FOR UPDATE USING (true);

ALTER TABLE public.user_saved_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write access to user_saved_sessions" ON public.user_saved_sessions FOR ALL USING (true) WITH CHECK (true);

-- Enable RLS and policies for notifications & user reads
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert access to notifications" ON public.notifications FOR INSERT WITH CHECK (true);

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write access to user_notification_reads" ON public.user_notification_reads FOR ALL USING (true) WITH CHECK (true);

