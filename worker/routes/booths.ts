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
boothsRouter.get('/', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  try {
    const { data, error } = await supabaseAdmin
      .from('booths')
      .select('*')
      .order('location', { ascending: true });

    if (!error && data && data.length > 0) {
      const formatted = data.map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        description: b.description || '',
        boothCode: b.booth_code,
        logoText: b.logo_text || '',
        logoUrl: b.logo_url || '',
        points: b.points || 15,
        location: b.location,
      }));
      return c.json(formatted);
    }
  } catch (err) {
    console.warn('[Booths] Failed to fetch booths from DB:', err);
  }

  return c.json([
    {
      id: '44fb4f52-7935-440d-9131-560cb488f344',
      name: '42KL',
      category: 'Community',
      logoText: '42 KL | Sunway Education Group',
      location: 'Hall A - #01',
      description: 'Peer-to-peer coding school in Sunway Education Group.',
      boothCode: 'BOOTH-42KL',
      points: 15,
    },
    {
      id: '902d52ff-b9b9-4e27-8ce8-403bcef6e001',
      name: 'Google Cloud Malaysia',
      category: 'Platinum Sponsor',
      logoText: 'Google Cloud',
      location: 'Hall A - #02',
      description: 'Enterprise cloud infrastructure, Kubernetes & BigQuery solutions.',
      boothCode: 'BOOTH-GCP',
      points: 15,
    },
    {
      id: '31eaffd9-e5f4-448c-9ecf-c42fe13e6f13',
      name: 'Flutter Community',
      category: 'Community',
      logoText: 'Flutter',
      location: 'Hall A - #04',
      description: 'Cross-platform app development community in Malaysia.',
      boothCode: 'BOOTH-FLUTTER',
      points: 15,
    },
    {
      id: '63844026-ba3f-4ea1-bbfd-af7b2058367a',
      name: 'TensorFlow & Gemini AI',
      category: 'Gold Sponsor',
      logoText: 'Gemini',
      location: 'Hall B - #10',
      description: 'Generative AI and open-source machine learning ecosystem.',
      boothCode: 'BOOTH-GEMINI',
      points: 15,
    },
  ]);
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
            const visitedBooths = annexData.booths.filter((b: any) => Boolean(b.visited));
            const stamps = visitedBooths.map((b: any) => b.id);
            const stampDetails = visitedBooths.map((b: any) => ({
              id: b.id,
              boothId: b.id,
              boothName: b.name,
              boothCode: b.name,
              category: 'Exhibition Booth',
              location: '',
              claimedAt: b.visitedAt || new Date().toISOString(),
              points: 15,
            }));

            const requiredStamps = Number(annexData.stamps?.required) || 3;
            const collectedStamps = Number(annexData.stamps?.collected) || stamps.length;
            const isComplete = Boolean(annexData.stamps?.complete || collectedStamps >= requiredStamps);

            return c.json({
              success: true,
              stamps,
              stampDetails,
              totalStamps: collectedStamps,
              requiredStamps,
              isComplete,
              totalPoints: collectedStamps * 15,
              booths: annexData.booths,
              source: 'annexhub',
            });
          }
        }
      } catch (annexErr) {
        console.warn('[Booths] AnnexHub progress fetch failed, falling back to Supabase:', annexErr);
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

    return c.json({
      success: true,
      stamps,
      stampDetails,
      totalStamps: stamps.length,
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
      .select('booth_id')
      .eq('user_id', userId);

    if (checkErr) {
      console.warn('[Booths] Error checking existing stamps:', checkErr);
    }

    const currentStampsList = (existingStamps || []).map((s) => s.booth_id);

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
