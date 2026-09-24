import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db.js';

export const boothsRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'devfest-kl-2026-super-secret-jwt-key';

// Helper to resolve user ID from email, userId, or Authorization Bearer header
const resolveUserId = async (
  req: Request,
  providedUserId?: string,
  providedEmail?: string
): Promise<{ userId: string | null; email: string | null }> => {
  let userEmail = providedEmail?.trim().toLowerCase() || null;
  let userId = providedUserId || null;

  // 1. Try resolving from Bearer JWT token if available
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; email?: string };
      if (decoded.id && !userId) userId = decoded.id;
      if (decoded.email && !userEmail) userEmail = decoded.email.toLowerCase();
    } catch {
      // Token expired or invalid, fall back to explicit parameters
    }
  }

  // 2. If userId is provided, verify it exists in profiles
  if (userId) {
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
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
const resolveBooth = async (identifier: string) => {
  if (!identifier) return null;
  const raw = identifier.trim();

  // 1. Check if direct UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
  if (isUuid) {
    const { data } = await supabaseAdmin
      .from('booths')
      .select('*')
      .eq('id', raw)
      .maybeSingle();
    if (data) return data;
  }

  // 2. Extract potential code variations
  // Handles "BOOTH-42KL", "DEVFEST-BOOTH-42KL", "https://.../booth/BOOTH-42KL", "42KL"
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
boothsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
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
      res.json(formatted);
      return;
    }
  } catch (err) {
    console.warn('[Booths] Failed to fetch booths from DB:', err);
  }

  // Fallback booths if database is unreachable
  res.json([
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
// Query params: ?email=... OR ?userId=..., or Bearer token header
// =============================================================================
boothsRouter.get('/stamps', async (req: Request, res: Response): Promise<void> => {
  const { email, userId: queryUserId } = req.query;

  try {
    const { userId } = await resolveUserId(
      req,
      typeof queryUserId === 'string' ? queryUserId : undefined,
      typeof email === 'string' ? email : undefined
    );

    if (!userId) {
      res.json({
        success: true,
        stamps: [],
        stampDetails: [],
        totalStamps: 0,
        totalPoints: 0,
      });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('user_stamps')
      .select('id, booth_id, claimed_at, booth:booths(*)')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: true });

    if (error) {
      console.warn('[Booths] Error fetching user stamps:', error);
      res.json({
        success: true,
        stamps: [],
        stampDetails: [],
        totalStamps: 0,
        totalPoints: 0,
      });
      return;
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

    res.json({
      success: true,
      stamps,
      stampDetails,
      totalStamps: stamps.length,
      totalPoints,
    });
  } catch (err: any) {
    console.error('[Booths] Unexpected error in GET /stamps:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user stamps.' });
  }
});

// =============================================================================
// 3. POST /api/booths/stamp - Claim booth passport stamp via QR scan
// Body: { boothId?, boothCode?, qrPayload?, userId?, email? }
// =============================================================================
boothsRouter.post('/stamp', async (req: Request, res: Response): Promise<void> => {
  const { boothId, boothCode, qrPayload, userId: bodyUserId, email: bodyEmail } = req.body;

  const rawBoothIdentifier = boothId || boothCode || qrPayload;

  // 1. Validate inputs
  if (!rawBoothIdentifier) {
    res.status(400).json({
      success: false,
      message: 'Booth identification (boothId, boothCode, or qrPayload) is required.',
    });
    return;
  }

  try {
    // 2. Resolve User
    const { userId } = await resolveUserId(req, bodyUserId, bodyEmail);
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Attendee must be signed in with a registered profile to claim stamps.',
      });
      return;
    }

    // 3. Resolve Booth
    const booth = await resolveBooth(rawBoothIdentifier);
    if (!booth) {
      res.status(404).json({
        success: false,
        message: 'Invalid booth QR code. No matching conference partner booth found.',
      });
      return;
    }

    // 4. Fetch all existing stamps for this user to check for duplicates
    const { data: existingStamps, error: checkErr } = await supabaseAdmin
      .from('user_stamps')
      .select('booth_id')
      .eq('user_id', userId);

    if (checkErr) {
      console.warn('[Booths] Error checking existing stamps:', checkErr);
    }

    const currentStampsList = (existingStamps || []).map((s) => s.booth_id);

    // Edge Case: Check if user already claimed this booth stamp
    if (currentStampsList.includes(booth.id)) {
      res.json({
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
      return;
    }

    // 5. Insert new stamp into user_stamps
    const { error: insertErr } = await supabaseAdmin
      .from('user_stamps')
      .insert({
        user_id: userId,
        booth_id: booth.id,
        claimed_at: new Date().toISOString(),
      });

    if (insertErr) {
      // If error is unique constraint violation (concurrent scan)
      if (insertErr.code === '23505') {
        res.json({
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
        return;
      }
      console.error('[Booths] Failed to insert stamp:', insertErr);
      res.status(500).json({ success: false, message: 'Failed to record stamp in database.' });
      return;
    }

    // 6. Return updated stamp card state
    const updatedStamps = [...currentStampsList, booth.id];

    res.json({
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
    res.status(500).json({ success: false, message: 'Server error processing stamp claim.' });
  }
});
