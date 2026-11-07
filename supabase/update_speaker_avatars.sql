-- =============================================================================
-- GOOGLE DEVFEST KUALA LUMPUR 2026 - SPEAKER AVATARS UPDATE
-- Updates speaker photos for single-speaker sessions using assets in /speakers
-- =============================================================================

-- Track 1: Builder Track (JC1)
UPDATE public.sessions 
SET speaker_avatar = '/speakers/LowWeiChung_Track1.png' 
WHERE id = '10000000-0000-0000-0000-000000000001' OR speaker_name ILIKE '%Wei Chung%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/DoddiPriyambodo_Track1.webp' 
WHERE id = '10000000-0000-0000-0000-000000000002' OR speaker_name ILIKE '%Doddi%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/DrPooKuanHoong_Track1.jpeg' 
WHERE id = '10000000-0000-0000-0000-000000000004' OR speaker_name ILIKE '%Dr Poo%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/trung-vo-Track1.jpg' 
WHERE id = '10000000-0000-0000-0000-000000000005' OR speaker_name ILIKE '%Trung Vo%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/VinLim_Track1.jpg' 
WHERE id = '10000000-0000-0000-0000-000000000006' OR speaker_name ILIKE '%Vin Lim%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/Selena_Track1.jpeg' 
WHERE id = '10000000-0000-0000-0000-000000000007' OR speaker_name ILIKE '%Selena%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/WeiYuan_Track1.jpeg' 
WHERE id = '10000000-0000-0000-0000-000000000008' OR speaker_name ILIKE '%Weiyuan%';

-- Track 2: Developer Track (JC2)
UPDATE public.sessions 
SET speaker_avatar = '/speakers/LeongLaiFong_Track2.jpeg' 
WHERE id = '20000000-0000-0000-0000-000000000001' OR speaker_name = 'Lai Fong';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/DarsshanNair_Track2.jpeg' 
WHERE id = '20000000-0000-0000-0000-000000000002' OR speaker_name ILIKE '%Darsshan%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/KatieBarnett_Track2.png' 
WHERE id = '20000000-0000-0000-0000-000000000005' OR speaker_name ILIKE '%Katie Barnett%';

-- Track 3: Hands-On Track (JC3)
UPDATE public.sessions 
SET speaker_avatar = '/speakers/LimShangYi_Track3.jpeg' 
WHERE id = '30000000-0000-0000-0000-000000000001' OR speaker_name ILIKE '%Shang Yi%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/Anupam_Phoghat_1.jpg' 
WHERE id = '30000000-0000-0000-0000-000000000002' OR speaker_name ILIKE '%Anupam%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/LoveeJain_Track3.jpeg' 
WHERE id = '30000000-0000-0000-0000-000000000003' OR speaker_name ILIKE '%Lovee%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/ChristineTee_Track3.jpeg' 
WHERE id = '30000000-0000-0000-0000-000000000004' OR speaker_name ILIKE '%Christine Tee%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/Jay_Thakkar.jfif' 
WHERE id = '30000000-0000-0000-0000-000000000005' OR speaker_name ILIKE '%Jay Thakkar%';

UPDATE public.sessions 
SET speaker_avatar = '/speakers/Connie_Track3.jpeg' 
WHERE id = '30000000-0000-0000-0000-000000000006' OR speaker_name ILIKE '%Connie%';
