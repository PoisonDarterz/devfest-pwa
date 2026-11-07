export const isGameBooth = (b: { id?: string; name?: string; booth_code?: string; boothCode?: string } | null | undefined): boolean => {
  if (!b) return false;
  const name = (b.name || '').toLowerCase();
  const code = (b.booth_code || b.boothCode || '').toUpperCase();
  const id = b.id || '';
  return id === '43af99eb-2163-428e-9558-3516e6210bc8' || code === 'BOOTH-NANOBANANA' || name.includes('nanobanana') || name.includes('game booth');
};

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getSupabaseAdmin, getJwtSecret } from '../db';
import type { Env } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

export const boothsRouter = new Hono<{ Bindings: Env }>();

// Helper to resolve user ID from email, userId, or Authorization Bearer header
const resolveUserId = async (
  c: any,
  supabaseAdmin: SupabaseClient,
  providedUserId?: string,
  providedEmail?: string
): Promise<{ userId: string | null; email: string | null }> => {
  let userEmail = providedEmail?.trim().toLowerCase() || null;
  let userId = providedUserId || null;

  // 1. Try resolving from Bearer JWT token if available
  const authHeader = c.req.header('authorization') || c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const jwtSecret = getJwtSecret(c.env);
      const decoded = (await verify(token, jwtSecret, 'HS256')) as { id?: string; email?: string };
      if (decoded.id && !userId) userId = decoded.id;
      if (decoded.email && !userEmail) userEmail = decoded.email.toLowerCase();
    } catch {
      // Token expired or invalid, fall back to explicit parameters
    }
  }

  // 2. If userId is provided, verify it exists in profiles
  const isUuid = !!userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId.trim());
  if (userId && isUuid) {
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('id', userId.trim())
        .maybeSingle();

      if (data?.id) {
        return { userId: data.id, email: data.email };
      }
    } catch (err) {
      console.warn('[Booths] Error verifying userId:', err);
    }
  }

  // 3. If email is provided, look up profile
  if (userEmail) {
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .ilike('email', userEmail)
        .maybeSingle();

      if (data?.id) {
        return { userId: data.id, email: data.email };
      }
    } catch (err) {
      console.warn('[Booths] Error verifying userEmail:', err);
    }
  }

  return { userId: null, email: userEmail };
};

// Helper to resolve a booth by UUID, booth code, or QR payload
const resolveBooth = async (supabaseAdmin: SupabaseClient, identifier: string) => {
  if (!identifier) return null;
  const raw = identifier.trim();

  // 1. Check if direct UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
  if (isUuid) {
    const { data } = await supabaseAdmin.from('booths').select('*').eq('id', raw).maybeSingle();
    if (data) return data;
  }

  // 2. Extract potential code variations
  let cleanCode = raw;
  if (cleanCode.includes('/')) {
    cleanCode = cleanCode.substring(cleanCode.lastIndexOf('/') + 1);
  }
  if (cleanCode.startsWith('DEVFEST-')) {
    cleanCode = cleanCode.replace(/^DEVFEST-/, '');
  }

  // Exact booth_code match (case-insensitive)
  const { data: codeMatch } = await supabaseAdmin
    .from('booths')
    .select('*')
    .ilike('booth_code', cleanCode)
    .maybeSingle();

  if (codeMatch) return codeMatch;

  // With or without 'BOOTH-' prefix
  const withPrefix = cleanCode.startsWith('BOOTH-') ? cleanCode : `BOOTH-${cleanCode}`;
  const { data: prefixMatch } = await supabaseAdmin
    .from('booths')
    .select('*')
    .ilike('booth_code', withPrefix)
    .maybeSingle();

  if (prefixMatch) return prefixMatch;

  // Match by name
  const { data: nameMatch } = await supabaseAdmin
    .from('booths')
    .select('*')
    .ilike('name', cleanCode)
    .maybeSingle();

  if (nameMatch) return nameMatch;

  return null;
};

// =============================================================================
// 1. GET /api/booths - Fetch all partner and sponsor booths
// =============================================================================
// AnnexHub 7 Exhibition Booths (Expected stamp booths)
export const ANNEXHUB_BOOTHS_FALLBACK = [
  {
    id: '09fe544d-180d-4fe7-9bdc-f904f655f7b4',
    name: 'Logitech Booth',
    category: 'Silver Sponsor',
    description: 'Explore Logitech developer peripherals and workspace gear.',
    boothCode: 'BOOTH-LOGITECH',
    logoText: 'Logitech',
    points: 15,
    location: 'Hall A - #01',
  },
  {
    id: '2ac6f20e-9a1f-482b-8d51-4b914ed67f6a',
    name: 'Odra Venture Booth',
    category: 'Gold Sponsor',
    description: 'Venture investments, tech ecosystem and startup acceleration.',
    boothCode: 'BOOTH-ODRA',
    logoText: 'Odra Venture',
    points: 15,
    location: 'Hall A - #02',
  },
  {
    id: '43af99eb-2163-428e-9558-3516e6210bc8',
    name: 'Nanobanana Game Booth',
    category: 'Community & Game',
    description: 'Interactive gaming showcase and community challenges.',
    boothCode: 'BOOTH-NANOBANANA',
    logoText: 'Nanobanana',
    points: 15,
    location: 'Hall B - #03',
  },
  {
    id: 'e413229a-f543-4d0e-a04e-e70a123a8d07',
    name: 'Jobstreet by SEEK Booth',
    category: 'Gold Sponsor',
    description: 'Career opportunities, talent insights, and dev recruitment.',
    boothCode: 'BOOTH-JOBSTREET',
    logoText: 'Jobstreet by SEEK',
    points: 15,
    location: 'Hall A - #04',
  },
  {
    id: 'f1687fb9-9185-445a-8157-3d4ec6a2c8bf',
    name: 'Deriv Booth',
    category: 'Gold Sponsor',
    description: 'Fintech engineering, trading APIs, and scalable infrastructure.',
    boothCode: 'BOOTH-DERIV',
    logoText: 'Deriv',
    points: 15,
    location: 'Hall A - #05',
  },
  {
    id: 'bcc90427-15cb-4406-b08a-5d2f2e6ee6b4',
    name: 'Cradle Fund Booth',
    category: 'Ecosystem Partner',
    description: 'Funding, grants, and support for Malaysian tech innovators.',
    boothCode: 'BOOTH-CRADLE',
    logoText: 'Cradle Fund',
    points: 15,
    location: 'Hall B - #06',
  },
  {
    id: '15d863cb-db9d-4944-aaf4-d2f7631e9b24',
    name: '42 Malaysia Booth',
    category: 'Venue Sponsor',
    description: 'Peer-to-peer coding education in Sunway Education Group.',
    boothCode: 'BOOTH-42MY',
    logoText: '42 Malaysia',
    points: 15,
    location: 'Hall A - #07',
  },
];

// =============================================================================
// 1. GET /api/booths - Fetch all partner and sponsor booths from AnnexHub (source of truth)
// =============================================================================
boothsRouter.get('/', async (c) => {
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : ({} as Record<string, string | undefined>);
  const annexApiKey = c.env?.ANNEXHUB_API_KEY || procEnv.ANNEXHUB_API_KEY;
  const annexEventId = c.env?.ANNEXHUB_EVENT_ID || procEnv.ANNEXHUB_EVENT_ID;

  // 1. AnnexHub Source of Truth: Fetch live event booths from AnnexHub progress
  if (annexApiKey && annexEventId) {
    try {
      const annexUrl = `https://api.annexhub.ai/api/v1/partner/events/${annexEventId}/progress`;
      const res = await fetch(annexUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': annexApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'partner-sync@devfest.kl' }),
      });

      if (res.ok) {
        const annexData = (await res.json()) as any;
        if (annexData && Array.isArray(annexData.booths)) {
          // Filter out redemption counter so only the 7 expected exhibition booths are returned for stamps
          const stampBooths = annexData.booths.filter(
            (b: any) => !b.name.toLowerCase().includes('redemption')
          );
          return c.json(
            stampBooths.map((b: any, index: number) => {
              const matchedFallback = ANNEXHUB_BOOTHS_FALLBACK.find(
                (fb) => fb.id === b.id || fb.name.toLowerCase() === b.name.toLowerCase()
              );
              return {
                id: b.id,
                name: b.name,
                category: matchedFallback?.category || 'Sponsor & Partner',
                description: matchedFallback?.description || '',
                boothCode: matchedFallback?.boothCode || `BOOTH-${b.name.replace(/\s+/g, '-').toUpperCase()}`,
                logoText: matchedFallback?.logoText || b.name,
                logoUrl: '',
                points: 15,
                location: matchedFallback?.location || `Hall A - #${String(index + 1).padStart(2, '0')}`,
              };
            })
          );
        }
      }
    } catch (annexErr) {
      console.warn('[Booths] AnnexHub booths fetch notice, querying Supabase:', annexErr);
    }
  }

  // 2. Query Supabase (synced with AnnexHub)
  const supabaseAdmin = getSupabaseAdmin(c.env);
  try {
    const { data, error } = await supabaseAdmin
      .from('booths')
      .select('*')
      .neq('category', 'Organizer & Swag')
      .order('location', { ascending: true });

    if (!error && data && data.length > 0) {
      const filtered = data.filter((b) => !b.name.toLowerCase().includes('redemption'));
      return c.json(
        filtered.map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category,
          description: b.description || '',
          boothCode: b.booth_code,
          logoText: b.logo_text || '',
          logoUrl: b.logo_url || '',
          points: b.points || 15,
          location: b.location,
        }))
      );
    }
  } catch (err) {
    console.warn('[Booths] Failed to fetch booths from DB:', err);
  }

  // 3. Fallback to AnnexHub 7 exhibition booths
  return c.json(ANNEXHUB_BOOTHS_FALLBACK);
});

// =============================================================================
// 2. GET /api/booths/stamps - Fetch all claimed stamps for the current user
// =============================================================================
boothsRouter.get('/stamps', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const email = c.req.query('email');
  const queryUserId = c.req.query('userId');

  try {
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const procEnv = typeof process !== 'undefined' && process.env ? process.env : ({} as Record<string, string | undefined>);

    // 1. Check AnnexHub integration if configured and user email is provided
    const annexApiKey = c.env?.ANNEXHUB_API_KEY || procEnv.ANNEXHUB_API_KEY;
    const annexEventId = c.env?.ANNEXHUB_EVENT_ID || procEnv.ANNEXHUB_EVENT_ID;

    if (annexApiKey && annexEventId && cleanEmail) {
      try {
        const annexUrl = `https://api.annexhub.ai/api/v1/partner/events/${annexEventId}/progress`;
        const annexRes = await fetch(annexUrl, {
          method: 'POST',
          headers: {
            'X-Api-Key': annexApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: cleanEmail }),
        });

        if (annexRes.ok) {
          const annexData = (await annexRes.json()) as any;
          if (annexData && Array.isArray(annexData.booths)) {
            // Filter out redemption counter so only the 7 expected exhibition booths are tracked for stamps
            const stampBooths = annexData.booths.filter(
              (b: any) => !b.name.toLowerCase().includes('redemption')
            );
            const visitedBooths = stampBooths.filter((b: any) => Boolean(b.visited));
            const stamps = visitedBooths.map((b: any) => b.id);
            const stampDetails = visitedBooths.map((b: any) => {
              const matchedFallback = ANNEXHUB_BOOTHS_FALLBACK.find(
                (fb) => fb.id === b.id || fb.name.toLowerCase() === b.name.toLowerCase()
              );
              return {
                id: b.id,
                boothId: b.id,
                boothName: b.name,
                boothCode: matchedFallback?.boothCode || b.name,
                category: matchedFallback?.category || 'Sponsor & Partner',
                location: matchedFallback?.location || '',
                claimedAt: b.visitedAt || new Date().toISOString(),
                points: 15,
              };
            });

            const hasGameBooth = visitedBooths.some((b: any) => isGameBooth(b));
            const regularVisitedBooths = visitedBooths.filter((b: any) => !isGameBooth(b));
            const regularStampsCount = regularVisitedBooths.length;
            const isGameBoothUnlocked = regularStampsCount >= 4;
            const isComplete = regularStampsCount >= 4 && hasGameBooth;
            const requiredStamps = 5; // 4 partner stamps + 1 game booth stamp
            const collectedStamps = stamps.length;

            return c.json({
              success: true,
              stamps,
              stampDetails,
              totalStamps: collectedStamps,
              requiredStamps,
              requiredRegularStamps: 4,
              regularStampsCount,
              hasGameBooth,
              isGameBoothUnlocked,
              expectedBooths: stampBooths.length, // 7
              isComplete,
              totalPoints: collectedStamps * 15,
              booths: stampBooths.map((b: any, index: number) => {
                const matched = ANNEXHUB_BOOTHS_FALLBACK.find(
                  (fb) => fb.id === b.id || fb.name.toLowerCase() === b.name.toLowerCase()
                );
                return {
                  id: b.id,
                  name: b.name,
                  category: matched?.category || 'Sponsor & Partner',
                  description: matched?.description || '',
                  boothCode: matched?.boothCode || `BOOTH-${b.name.replace(/\s+/g, '-').toUpperCase()}`,
                  logoText: matched?.logoText || b.name,
                  logoUrl: '',
                  points: 15,
                  location: matched?.location || `Hall A - #${String(index + 1).padStart(2, '0')}`,
                };
              }),
              source: 'annexhub',
            });
          }
        }
      } catch (annexErr) {
        console.warn('[Booths] AnnexHub progress fetch notice:', annexErr);
      }
    }
    const { userId } = await resolveUserId(c, supabaseAdmin, queryUserId, email);

    if (!userId) {
      return c.json({
        success: true,
        stamps: [],
        stampDetails: [],
        totalStamps: 0,
        totalPoints: 0,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('user_stamps')
      .select('id, booth_id, claimed_at, booth:booths(*)')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: true });

    if (error) {
      console.warn('[Booths] Error fetching user stamps:', error);
      return c.json({
        success: true,
        stamps: [],
        stampDetails: [],
        totalStamps: 0,
        totalPoints: 0,
      });
    }

    const stampDetails = (data || []).map((row: any) => ({
      id: row.id,
      boothId: row.booth_id,
      boothName: row.booth?.name || 'Partner Booth',
      boothCode: row.booth?.booth_code || '',
      category: row.booth?.category || '',
      location: row.booth?.location || '',
      claimedAt: row.claimed_at,
      points: row.booth?.points || 15,
    }));

    const stamps = stampDetails.map((s) => s.boothId);
    const totalPoints = stampDetails.reduce((sum, s) => sum + s.points, 0);

    const hasGameBooth = (data || []).some((row: any) => isGameBooth(row.booth || { id: row.booth_id }));
    const regularVisited = (data || []).filter((row: any) => !isGameBooth(row.booth || { id: row.booth_id }));
    const regularStampsCount = regularVisited.length;
    const isGameBoothUnlocked = regularStampsCount >= 4;
    const isComplete = regularStampsCount >= 4 && hasGameBooth;

    return c.json({
      success: true,
      stamps,
      stampDetails,
      totalStamps: stamps.length,
      requiredStamps: 5,
      requiredRegularStamps: 4,
      regularStampsCount,
      hasGameBooth,
      isGameBoothUnlocked,
      isComplete,
      totalPoints,
    });
  } catch (err: any) {
    console.error('[Booths] Unexpected error in GET /stamps:', err);
    return c.json({ success: false, message: 'Failed to fetch user stamps.' }, 500);
  }
});

// =============================================================================
// 3. POST /api/booths/stamp - Claim booth passport stamp via QR scan
// =============================================================================
boothsRouter.post('/stamp', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { boothId, boothCode, qrPayload, userId: bodyUserId, email: bodyEmail } = body;

  const rawBoothIdentifier = boothId || boothCode || qrPayload;

  if (!rawBoothIdentifier) {
    return c.json(
      {
        success: false,
        message: 'Booth identification (boothId, boothCode, or qrPayload) is required.',
      },
      400
    );
  }

  try {
    const { userId } = await resolveUserId(c, supabaseAdmin, bodyUserId, bodyEmail);
    if (!userId) {
      return c.json(
        {
          success: false,
          message: 'Attendee must be signed in with a registered profile to claim stamps.',
        },
        401
      );
    }

    // Check Walk-in restriction
    try {
      const { data: prof } = await supabaseAdmin
        .from('vw_profiles')
        .select('ticket_type')
        .eq('id', userId)
        .maybeSingle();

      const ticketType = prof?.ticket_type || '';
      if (ticketType.toLowerCase().includes('walk-in')) {
        return c.json(
          {
            success: false,
            isWalkIn: true,
            message:
              'Passport stamps and rewards are exclusive to registered attendees. Walk-in passes do not include stamp access.',
          },
          403
        );
      }
    } catch (err) {
      console.warn('[Booths] Error checking walk-in status:', err);
    }

    const booth = await resolveBooth(supabaseAdmin, rawBoothIdentifier);
    if (!booth) {
      return c.json(
        {
          success: false,
          message: 'Invalid booth QR code. No matching conference partner booth found.',
        },
        404
      );
    }

    const { data: existingStamps, error: checkErr } = await supabaseAdmin
      .from('user_stamps')
      .select('booth_id, booth:booths(id, name, booth_code)')
      .eq('user_id', userId);

    if (checkErr) {
      console.warn('[Booths] Error checking existing stamps:', checkErr);
    }

    const currentStampsList = (existingStamps || []).map((s: any) => s.booth_id);

    // Enforce 4-partner-stamp prerequisite before claiming Game Booth stamp
    if (isGameBooth(booth)) {
      const regularCount = (existingStamps || []).filter((s: any) => !isGameBooth(s.booth || { id: s.booth_id })).length;
      if (regularCount < 4) {
        return c.json(
          {
            success: false,
            isGameBoothLocked: true,
            regularStampsCount: regularCount,
            requiredRegularStamps: 4,
            message: `The Nanobanana Game Booth is locked! You must collect at least 4 partner booth stamps before earning the Game Booth stamp (${regularCount}/4 collected).`,
          },
          400
        );
      }
    }

    if (currentStampsList.includes(booth.id)) {
      return c.json({
        success: false,
        alreadyClaimed: true,
        booth: {
          id: booth.id,
          name: booth.name,
          category: booth.category,
          boothCode: booth.booth_code,
          points: booth.points || 15,
          location: booth.location,
        },
        stamps: currentStampsList,
        totalStamps: currentStampsList.length,
        message: `You've already collected the stamp for ${booth.name}!`,
      });
    }

    const { error: insertErr } = await supabaseAdmin.from('user_stamps').insert({
      user_id: userId,
      booth_id: booth.id,
      claimed_at: new Date().toISOString(),
    });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return c.json({
          success: false,
          alreadyClaimed: true,
          booth: {
            id: booth.id,
            name: booth.name,
            category: booth.category,
            boothCode: booth.booth_code,
            points: booth.points || 15,
            location: booth.location,
          },
          stamps: currentStampsList,
          totalStamps: currentStampsList.length,
          message: `You've already collected the stamp for ${booth.name}!`,
        });
      }
      console.error('[Booths] Failed to insert stamp:', insertErr);
      return c.json({ success: false, message: 'Failed to record stamp in database.' }, 500);
    }

    const updatedStamps = [...currentStampsList, booth.id];

    return c.json({
      success: true,
      alreadyClaimed: false,
      booth: {
        id: booth.id,
        name: booth.name,
        category: booth.category,
        boothCode: booth.booth_code,
        points: booth.points || 15,
        location: booth.location,
      },
      stamps: updatedStamps,
      totalStamps: updatedStamps.length,
      message: `Stamp Claimed! Visited ${booth.name} (+${booth.points || 15} Pts)`,
    });
  } catch (err: any) {
    console.error('[Booths] Unexpected error in /stamp:', err);
    return c.json({ success: false, message: 'Server error processing stamp claim.' }, 500);
  }
});
