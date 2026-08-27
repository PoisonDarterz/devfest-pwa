-- =============================================================================
-- GOOGLE DEVFEST KUALA LUMPUR 2026 - INITIAL SEED DATA
-- Execute this SQL script in your Supabase SQL Editor to populate initial records.
-- =============================================================================

-- 1. SEED BOOTHS
INSERT INTO public.booths (name, category, logo_text, location, description, booth_code, points)
VALUES
  ('42KL', 'Community', '42 KL | Sunway Education Group', 'Hall A - #01', 'Peer-to-peer coding school in Sunway Education Group.', 'BOOTH-42KL', 15),
  ('Google Cloud Malaysia', 'Platinum Sponsor', 'Google Cloud', 'Hall A - #02', 'Enterprise cloud infrastructure, Kubernetes & BigQuery solutions.', 'BOOTH-GCP', 15),
  ('Flutter Community', 'Community', 'Flutter MY', 'Hall A - #04', 'Cross-platform app development community in Malaysia.', 'BOOTH-FLUTTER', 15),
  ('TensorFlow & Gemini AI', 'Gold Sponsor', 'TensorFlow', 'Hall B - #10', 'Machine learning, model fine-tuning and Gemini API workshops.', 'BOOTH-GEMINI', 15)
ON CONFLICT (booth_code) DO NOTHING;

-- 2. SEED SESSIONS (9 Total Sessions across 3 Tracks)
INSERT INTO public.sessions (title, speaker_name, speaker_role, speaker_avatar, track, room, time, description)
VALUES
  (
    'Develop multi agent system with Agent Development Kit',
    'Liam & Megan Kasselberg',
    'Senior UX Writer & GDE',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'AI / ML',
    'Main Auditorium',
    '10:30 AM',
    'Liam speaks with Megan Kasselberg, whose work as a senior UX writer and content designer touches billions of users through the Material Design system.'
  ),
  (
    'From Docker to Docker Compose Workflows',
    'Sarah Lim',
    'DevOps Lead @ TechScale',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    'Cloud & DevOps',
    'Hall A (Tech Stage)',
    '11:30 AM',
    'Learn best practices for multi-container orchestration, development setup, and production deployment pipeline security.'
  ),
  (
    'Getting Started with MCP, ADK and A2A Architectures',
    'Jonas Tan',
    'Staff AI Engineer',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'AI / ML',
    'Hall B (Web Stage)',
    '02:00 PM',
    'Explore Model Context Protocol (MCP), Agent Development Kit, and Agent-to-Agent protocol paradigms.'
  ),
  (
    'Advanced Fine-Tuning with Google Gemma',
    'Dr. Evelyn Carter',
    'AI Researcher @ Google DeepMind',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'AI / ML',
    'Main Auditorium',
    '12:30 PM',
    'Deep dive into LoRA, QLoRA, and reinforcement learning with human feedback (RLHF) techniques using Google Gemma model family.'
  ),
  (
    'Kubernetes Autoscale and Multi-Region Deployments',
    'Marcus Chen',
    'Solutions Architect @ GCP',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    'Cloud & DevOps',
    'Hall A (Tech Stage)',
    '01:30 PM',
    'Explore HPA, VPA, Karpenter autoscaling, and global multi-region traffic routing strategies on GKE.'
  ),
  (
    'Flutter 4: What is new in Cross-Platform Mobile',
    'Aisha Rahman',
    'GDE in Flutter',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    'Mobile & Flutter',
    'Hall B (Web Stage)',
    '12:00 PM',
    'Learn about the latest compilation targets, performance enhancements, and Impeller engine details in Flutter 4.'
  ),
  (
    'Building Custom MCP Servers for Codebase Context',
    'Ravi Kumar',
    'Senior Developer Advocate',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    'Keynote',
    'Main Auditorium',
    '03:30 PM',
    'Learn how to extend LLM capabilities with custom tools and data services by building your own Model Context Protocol server.'
  ),
  (
    'GitOps Pipelines with ArgoCD & Terraform',
    'Elena Rostova',
    'Platform Engineer @ GitFlow',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    'Cloud & DevOps',
    'Hall A (Tech Stage)',
    '04:00 PM',
    'Automate cluster state configuration and infrastructure provisioning safely via Git commits using declarative tooling.'
  ),
  (
    'Building Next-Gen PWAs with Vite and Workbox',
    'Kenji Sato',
    'Frontend Architect',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    'Web & Chrome',
    'Hall B (Web Stage)',
    '03:00 PM',
    'Maximize offline capability, precaching, background sync, and notification pushes using Vite PWA configs.'
  );

-- 3. SEED FAQS
INSERT INTO public.faqs (question, answer, category)
VALUES
  (
    'How do I check in with my Peatix ticket?',
    'Sign in with your Google account used on Peatix. Your QR code will be generated automatically for entry scanning.',
    'Peatix & Tickets'
  ),
  (
    'Where is Google DevFest KL 2026 located?',
    'KL Convention Centre (KLCC), Level 3 Grand Ballroom. Accessible via LRT Kelana Jaya Line & MRT Putrajaya Line.',
    'Venue & Access'
  ),
  (
    'How does the NFC Phone Bump feature work?',
    'On Android Chrome, tap "Friends" and hold devices back-to-back to swap contact profiles automatically!',
    'WiFi & Apps'
  );

-- 4. SEED REWARDS & SWAG CATALOGUE
INSERT INTO public.rewards (title, subtitle, required_stamps, total_quantity, remaining_quantity, drop_weight, rarity)
VALUES
  (
    '7 days Free Gemini Pro',
    'Valid until 31/12/2026. First come first served basis.',
    1,
    100,
    100,
    50,
    'Common'
  ),
  (
    'GDGKL Blind Box',
    'Collect 5 stamps from partner booths to unlock.',
    5,
    50,
    50,
    10,
    'Rare'
  ),
  (
    'DevFest Limited Edition T-Shirt',
    'Exclusive cotton conference tee.',
    3,
    30,
    30,
    20,
    'Epic'
  );

-- 5. SEED TICKET WHITELIST FOR TEST USERS
INSERT INTO public.ticketing_whitelists (email, ticket_type, external_ref_id)
VALUES
  ('zixu.cheah@devfest.kl', 'Standard Attendee', 'PEATIX-12345'),
  ('jonas.chuan@devfest.kl', 'Standard Attendee', 'PEATIX-67890')
ON CONFLICT (email) DO NOTHING;

-- 6. SEED PROFILES & DEMO USERS
-- Insert dummy Auth Users if auth schema is present
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'zixu.cheah@devfest.kl', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zixu Cheah"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'jonas.chuan@devfest.kl', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jonas Chuan"}', NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Insert User Profiles matching MOCK_USER_PROFILE and MOCK_DISCOVERED_FRIEND
INSERT INTO public.profiles (id, email, full_name, company_role, avatar_url, bio, github_url, linkedin_url, qr_payload, ticket_type, is_ticket_verified, is_checked_in)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'zixu.cheah@devfest.kl',
    'Zixu Cheah',
    'Software Engineer',
    '',
    'Full-stack engineer building high-performance web applications and PWAs.',
    'https://github.com/zixucheah',
    'https://linkedin.com/in/zixucheah',
    'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
    'Standard Attendee',
    true,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'jonas.chuan@devfest.kl',
    'Jonas Chuan',
    'Mobile Developer',
    '',
    'Building Android apps & PWAs. Passionate about Kotlin, Flutter, and web performance!',
    'https://github.com/jonaschuan',
    'https://linkedin.com/in/jonaschuan',
    'DEVFEST-KL-2026-JONAS-CHUAN-DEV',
    'Standard Attendee',
    true,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  company_role = EXCLUDED.company_role,
  bio = EXCLUDED.bio,
  github_url = EXCLUDED.github_url,
  linkedin_url = EXCLUDED.linkedin_url,
  qr_payload = EXCLUDED.qr_payload;
