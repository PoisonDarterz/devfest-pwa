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
    avatar_url TEXT,
    bio TEXT,
    github_url TEXT,
    linkedin_url TEXT,
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

-- =============================================================================
-- SAMPLE SEED DATA
-- =============================================================================

INSERT INTO public.ticketing_whitelists (email, ticket_type, external_ref_id, notes) VALUES
('zixu.cheah@devfest.kl', 'Standard Attendee', 'T2U-100892', 'Ticket2u Registration'),
('jonas.chuan@devfest.kl', 'Standard Attendee', 'T2U-100893', 'Ticket2u Registration'),
('speaker@devfest.kl', 'Speaker', 'T2U-VIP001', 'Keynote Speaker')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.booths (name, category, description, booth_code, logo_text, location) VALUES
('42KL', 'Community', 'Peer-to-peer coding school in Sunway Education Group.', 'BOOTH-42KL', '42 KL | Sunway Education Group', 'Hall A - #01'),
('Google Cloud Malaysia', 'Platinum Sponsor', 'Enterprise cloud infrastructure, Kubernetes & BigQuery solutions.', 'BOOTH-GCP', 'Google Cloud', 'Hall A - #02'),
('Flutter Community', 'Community', 'Cross-platform app development community in Malaysia.', 'BOOTH-FLUTTER', 'Flutter MY', 'Hall A - #04'),
('TensorFlow & Gemini AI', 'Gold Sponsor', 'Machine learning, model fine-tuning and Gemini API workshops.', 'BOOTH-GEMINI', 'TensorFlow', 'Hall B - #10')
ON CONFLICT (booth_code) DO NOTHING;

INSERT INTO public.sessions (title, speaker_name, speaker_role, speaker_avatar, track, room, time, description) VALUES
('Develop multi agent system with Agent Development Kit', 'Liam & Megan Kasselberg', 'Senior UX Writer & GDE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 'AI / ML', 'Main Auditorium', '10:30 AM', 'Liam speaks with Megan Kasselberg, whose work as a senior UX writer touches billions through Material Design.'),
('From Docker to Docker Compose Workflows', 'Sarah Lim', 'DevOps Lead @ TechScale', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80', 'Cloud & DevOps', 'Hall A (Tech Stage)', '11:30 AM', 'Learn best practices for multi-container orchestration, development setup, and production deployment.'),
('Getting Started with MCP, ADK and A2A Architectures', 'Jonas Tan', 'Staff AI Engineer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 'AI / ML', 'Hall B (Web Stage)', '02:00 PM', 'Explore Model Context Protocol (MCP), Agent Development Kit, and Agent-to-Agent protocol paradigms.')
ON CONFLICT DO NOTHING;

INSERT INTO public.faqs (question, answer, category) VALUES
('How do I register for DevFest KL 2026 PWA?', 'When organizers send out the PWA link, sign in with the email used to buy your Ticket2u ticket. Your ticket will be verified automatically.', 'Registration & Tickets'),
('Where is Google DevFest KL 2026 located?', 'KL Convention Centre (KLCC), Level 3 Grand Ballroom. Accessible via LRT Kelana Jaya Line & MRT Putrajaya Line.', 'Venue & Access'),
('How does the NFC Phone Bump feature work?', 'On Android Chrome, tap "Friends" and hold devices back-to-back to swap contact profiles automatically!', 'WiFi & Apps')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) Policies for Public Read
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to booths" ON public.booths FOR SELECT USING (true);
CREATE POLICY "Allow public read access to sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to faqs" ON public.faqs FOR SELECT USING (true);
