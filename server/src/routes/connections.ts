import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const connectionsRouter = Router();

const COLOR_PALETTE = [
  'bg-[#2A3A68]', // Navy Blue
  'bg-[#2D6E66]', // Pine Green
  'bg-[#7A662E]', // Warm Olive
  'bg-[#8F3E29]', // Terracotta
  'bg-[#4B3B6B]', // Royal Purple
  'bg-[#2C5E8A]', // Steel Blue
  'bg-[#964B00]', // Deep Amber
];

// Helper to derive initials from a full name
const getInitials = (name: string): string => {
  if (!name) return 'DF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper to format short display name (e.g., "Zixu C.")
const getDisplayName = (fullName: string): string => {
  if (!fullName) return 'Attendee';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

// Deterministic color assignment based on string hash
const getColorForId = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[idx];
};

const formatFriendProfile = (friendProfile: any, connectionRow?: any) => {
  const initials = getInitials(friendProfile.full_name || 'Attendee');
  const displayName = getDisplayName(friendProfile.full_name || 'Attendee');
  const color = getColorForId(friendProfile.id || friendProfile.email || 'friend');

  return {
    id: friendProfile.id,
    name: friendProfile.full_name || 'Attendee',
    displayName,
    role: friendProfile.company_role || 'Attendee',
    bio: friendProfile.bio || 'Attending Google DevFest KL 2026.',
    initials,
    color,
    githubUrl: friendProfile.github_url || '',
    linkedinUrl: friendProfile.linkedinUrl || friendProfile.linkedin_url || '',
    email: friendProfile.email || '',
    qrPayload: friendProfile.qr_payload || '',
    method: connectionRow?.method || 'QR Scan',
    connectedAt: connectionRow?.created_at || new Date().toISOString(),
  };
};

/**
 * GET /api/connections
 * Query parameters: ?userId=... OR ?email=...
 */
connectionsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { userId, email } = req.query;

  if (!userId && !email) {
    res.status(400).json({ success: false, message: 'userId or email is required.' });
    return;
  }

  try {
    let resolvedUserId = (userId as string) || '';

    // If email provided without valid userId, resolve from profiles
    if (!resolvedUserId && email) {
      const normalizedEmail = (email as string).trim().toLowerCase();
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (userProfile?.id) {
        resolvedUserId = userProfile.id;
      }
    }

    if (!resolvedUserId) {
      res.json([]);
      return;
    }

    // Query connections joined with profiles
    const { data, error } = await supabaseAdmin
      .from('connections')
      .select('id, method, created_at, friend:profiles!connections_friend_id_fkey(*)')
      .eq('user_id', resolvedUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Connections] Query error:', error);
      res.json([]);
      return;
    }

    const friends = (data || [])
      .filter((row: any) => row.friend)
      .map((row: any) => formatFriendProfile(row.friend, row));

    res.json(friends);
  } catch (err) {
    console.error('[Connections] Unexpected error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch connections.' });
  }
});

/**
 * GET /api/connections/:userId
 * Backwards-compatible route for fetching by userId parameter
 */
connectionsRouter.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('connections')
      .select('id, method, created_at, friend:profiles!connections_friend_id_fkey(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const friends = data
        .filter((row: any) => row.friend)
        .map((row: any) => formatFriendProfile(row.friend, row));
      res.json(friends);
      return;
    }
  } catch (err) {
    console.warn('[Connections] Failed to fetch by param:', err);
  }
  res.json([]);
});

/**
/**
 * Add or exchange a friend connection via QR Scan or NFC Bump
 */
const handleAddConnection = async (req: Request, res: Response): Promise<void> => {
  const { userId, userEmail, friendId, qrPayload, nfcToken, friendEmail, method = 'QR Scan' } = req.body;

  if (!userId && !userEmail) {
    res.status(400).json({ success: false, message: 'Active user identification (userId or userEmail) is required.' });
    return;
  }

  try {
    // 1. Resolve Active User Profile
    let activeUser: any = null;
    if (userId) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
      activeUser = data;
    }
    if (!activeUser && userEmail) {
      const normalizedEmail = (userEmail as string).trim().toLowerCase();
      const { data } = await supabaseAdmin.from('profiles').select('*').ilike('email', normalizedEmail).maybeSingle();
      activeUser = data;
    }

    if (!activeUser) {
      res.status(404).json({ success: false, message: 'Active user profile not found in database.' });
      return;
    }

    // 2. Resolve Friend Profile
    let friendProfile: any = null;

    // A. Check by friendId (UUID)
    if (friendId) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', friendId).maybeSingle();
      friendProfile = data;
    }

    // B. Check by qrPayload (e.g. DEVFEST-KL-2026-..., email, or json)
    if (!friendProfile && qrPayload) {
      let candidate = (qrPayload as string).trim();

      // Check if candidate is JSON string
      if (candidate.startsWith('{') && candidate.endsWith('}')) {
        try {
          const parsed = JSON.parse(candidate);
          if (parsed.id) {
            const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', parsed.id).maybeSingle();
            if (data) friendProfile = data;
          }
          if (!friendProfile && parsed.email) {
            const { data } = await supabaseAdmin.from('profiles').select('*').ilike('email', parsed.email).maybeSingle();
            if (data) friendProfile = data;
          }
        } catch {}
      }

      // Query by direct qr_payload
      if (!friendProfile) {
        const { data } = await supabaseAdmin.from('profiles').select('*').eq('qr_payload', candidate).maybeSingle();
        friendProfile = data;
      }

      // Query by email if candidate contains @
      if (!friendProfile && candidate.includes('@')) {
        const { data } = await supabaseAdmin.from('profiles').select('*').ilike('email', candidate.toLowerCase()).maybeSingle();
        friendProfile = data;
      }
    }

    // C. Check by nfcToken
    if (!friendProfile && nfcToken) {
      const token = (nfcToken as string).trim();
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('nfc_token', token).maybeSingle();
      friendProfile = data;

      // Also check if nfc token matches qr_payload
      if (!friendProfile) {
        const { data: byQr } = await supabaseAdmin.from('profiles').select('*').eq('qr_payload', token).maybeSingle();
        friendProfile = byQr;
      }
    }

    // D. Check by friendEmail
    if (!friendProfile && friendEmail) {
      const normalizedEmail = (friendEmail as string).trim().toLowerCase();
      const { data } = await supabaseAdmin.from('profiles').select('*').ilike('email', normalizedEmail).maybeSingle();
      friendProfile = data;
    }

    if (!friendProfile) {
      res.status(404).json({
        success: false,
        message: 'Could not find an attendee matching this QR code or NFC token.',
      });
      return;
    }

    // 3. Prevent connecting with self
    if (activeUser.id === friendProfile.id) {
      res.status(400).json({
        success: false,
        message: 'You cannot connect with your own badge!',
      });
      return;
    }

    // 4. Save primary connection (Active User -> Friend)
    const { data: connData, error: connError } = await supabaseAdmin
      .from('connections')
      .upsert({
        user_id: activeUser.id,
        friend_id: friendProfile.id,
        method,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,friend_id' })
      .select();

    if (connError) {
      console.warn('[Connections] Upsert error:', connError);
      res.status(500).json({ success: false, message: 'Failed to record connection.' });
      return;
    }

    // 5. If NFC Bump, automatically create reciprocal connection (Friend -> Active User)
    let isMutual = false;
    if (method === 'NFC Bump') {
      await supabaseAdmin
        .from('connections')
        .upsert({
          user_id: friendProfile.id,
          friend_id: activeUser.id,
          method: 'NFC Bump',
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id,friend_id' });
      isMutual = true;
    }

    const formattedFriend = formatFriendProfile(friendProfile, connData?.[0]);

    res.json({
      success: true,
      friend: formattedFriend,
      isMutual,
      message: isMutual
        ? `NFC Bump successful! Exchanged profiles with ${friendProfile.full_name}.`
        : `Connected with ${friendProfile.full_name}!`,
    });
  } catch (err: any) {
    console.error('[Connections] Add connection error:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error while connecting.' });
  }
};

connectionsRouter.post('/add', handleAddConnection);
connectionsRouter.post('/', handleAddConnection);

/**
 * GET /api/connections/details/:friendId
 */
connectionsRouter.get('/details/:friendId', async (req: Request, res: Response): Promise<void> => {
  const { friendId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .maybeSingle();

    if (!error && data) {
      res.json({ success: true, friend: formatFriendProfile(data) });
      return;
    }
  } catch (err) {
    console.warn('[Connections] Details fetch error:', err);
  }

  res.status(404).json({ success: false, message: 'Friend profile not found.' });
});
