import { Hono } from 'hono';
import { getSupabaseAdmin } from '../db';
import type { Env } from '../types';

export const connectionsRouter = new Hono<{ Bindings: Env }>();

const COLOR_PALETTE = [
  'bg-[#2A3A68]', // Navy Blue
  'bg-[#2D6E66]', // Pine Green
  'bg-[#7A662E]', // Warm Olive
  'bg-[#8F3E29]', // Terracotta
  'bg-[#4B3B6B]', // Royal Purple
  'bg-[#2C5E8A]', // Steel Blue
  'bg-[#964B00]', // Deep Amber
];

const getInitials = (name: string): string => {
  if (!name) return 'DF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDisplayName = (fullName: string): string => {
  if (!fullName) return 'Attendee';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

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
connectionsRouter.get('/', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const userId = c.req.query('userId');
  const email = c.req.query('email');

  if (!userId && !email) {
    return c.json({ success: false, message: 'userId or email is required.' }, 400);
  }

  try {
    let resolvedUserId = userId || '';

    if (!resolvedUserId && email) {
      const normalizedEmail = email.trim().toLowerCase();
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
      return c.json([]);
    }

    const { data, error } = await supabaseAdmin
      .from('connections')
      .select('id, method, created_at, friend:profiles!connections_friend_id_fkey(*)')
      .eq('user_id', resolvedUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Connections] Query error:', error);
      return c.json([]);
    }

    const friends = (data || [])
      .filter((row: any) => row.friend)
      .map((row: any) => formatFriendProfile(row.friend, row));

    return c.json(friends);
  } catch (err) {
    console.error('[Connections] Unexpected error:', err);
    return c.json({ success: false, message: 'Failed to fetch connections.' }, 500);
  }
});

/**
 * GET /api/connections/details/:friendId
 */
connectionsRouter.get('/details/:friendId', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const friendId = c.req.param('friendId');

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .maybeSingle();

    if (!error && data) {
      return c.json({ success: true, friend: formatFriendProfile(data) });
    }
  } catch (err) {
    console.warn('[Connections] Details fetch error:', err);
  }

  return c.json({ success: false, message: 'Friend profile not found.' }, 404);
});

/**
 * GET /api/connections/:userId
 */
connectionsRouter.get('/:userId', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const userId = c.req.param('userId');
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
      return c.json(friends);
    }
  } catch (err) {
    console.warn('[Connections] Failed to fetch by param:', err);
  }
  return c.json([]);
});

/**
 * Add or exchange a friend connection via QR Scan or NFC Bump
 */
const handleAddConnection = async (c: any) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { userId, userEmail, friendId, qrPayload, nfcToken, friendEmail, method = 'QR Scan' } = body;

  if (!userId && !userEmail) {
    return c.json({ success: false, message: 'Active user identification (userId or userEmail) is required.' }, 400);
  }

  try {
    let activeUser: any = null;
    if (userId) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
      activeUser = data;
    }
    if (!activeUser && userEmail) {
      const normalizedEmail = String(userEmail).trim().toLowerCase();
      const { data } = await supabaseAdmin.from('profiles').select('*').ilike('email', normalizedEmail).maybeSingle();
      activeUser = data;
    }

    if (!activeUser) {
      return c.json({ success: false, message: 'Active user profile not found in database.' }, 404);
    }

    let friendProfile: any = null;

    if (friendId) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', friendId).maybeSingle();
      friendProfile = data;
    }

    if (!friendProfile && qrPayload) {
      const candidate = String(qrPayload).trim();

      let pkParam: string | null = null;
      if (candidate.includes('pk=')) {
        try {
          const parsedUrl = new URL(candidate);
          pkParam = parsedUrl.searchParams.get('pk')?.trim() || null;
        } catch {}
      }

      if (candidate.startsWith('{') && candidate.endsWith('}')) {
        try {
          const parsed = JSON.parse(candidate);
          if (parsed.id) {
            const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', parsed.id).maybeSingle();
            if (data) friendProfile = data;
          }
          if (!friendProfile && (parsed.pk || parsed.ticket)) {
            pkParam = (parsed.pk || parsed.ticket)?.trim() || null;
          }
          if (!friendProfile && parsed.email) {
            const { data } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .ilike('email', parsed.email)
              .maybeSingle();
            if (data) friendProfile = data;
          }
        } catch {}
      }

      if (!friendProfile) {
        const { data } = await supabaseAdmin.from('profiles').select('*').eq('qr_payload', candidate).maybeSingle();
        friendProfile = data;
      }

      if (!friendProfile && pkParam) {
        const { data } = await supabaseAdmin
          .from('vw_profiles')
          .select('*')
          .or(`external_ref_id.eq.${pkParam},qr_payload.ilike.%${pkParam}%`)
          .maybeSingle();
        if (data) friendProfile = data;
      }

      if (!friendProfile) {
        const { data } = await supabaseAdmin
          .from('vw_profiles')
          .select('*')
          .or(`external_ref_id.eq.${candidate},qr_payload.eq.${candidate}`)
          .maybeSingle();
        if (data) friendProfile = data;
      }

      if (!friendProfile && candidate.includes('@')) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .ilike('email', candidate.toLowerCase())
          .maybeSingle();
        friendProfile = data;
      }
    }

    if (!friendProfile && nfcToken) {
      const token = String(nfcToken).trim();
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('nfc_token', token).maybeSingle();
      friendProfile = data;

      if (!friendProfile) {
        const { data: byQr } = await supabaseAdmin.from('profiles').select('*').eq('qr_payload', token).maybeSingle();
        friendProfile = byQr;
      }
    }

    if (!friendProfile && friendEmail) {
      const normalizedEmail = String(friendEmail).trim().toLowerCase();
      const { data } = await supabaseAdmin.from('profiles').select('*').ilike('email', normalizedEmail).maybeSingle();
      friendProfile = data;
    }

    if (!friendProfile) {
      return c.json(
        {
          success: false,
          message: 'Could not find an attendee matching this QR code or NFC token.',
        },
        404
      );
    }

    if (activeUser.id === friendProfile.id) {
      return c.json(
        {
          success: false,
          message: 'You cannot connect with your own badge!',
        },
        400
      );
    }

    const { data: connData, error: connError } = await supabaseAdmin
      .from('connections')
      .upsert(
        {
          user_id: activeUser.id,
          friend_id: friendProfile.id,
          method,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,friend_id' }
      )
      .select();

    if (connError) {
      console.warn('[Connections] Upsert error:', connError);
      return c.json({ success: false, message: 'Failed to record connection.' }, 500);
    }

    let isMutual = false;
    if (method === 'NFC Bump') {
      await supabaseAdmin.from('connections').upsert(
        {
          user_id: friendProfile.id,
          friend_id: activeUser.id,
          method: 'NFC Bump',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,friend_id' }
      );
      isMutual = true;
    }

    const formattedFriend = formatFriendProfile(friendProfile, connData?.[0]);

    return c.json({
      success: true,
      friend: formattedFriend,
      isMutual,
      message: isMutual
        ? `NFC Bump successful! Exchanged profiles with ${friendProfile.full_name}.`
        : `Connected with ${friendProfile.full_name}!`,
    });
  } catch (err: any) {
    console.error('[Connections] Add connection error:', err);
    return c.json({ success: false, message: err?.message || 'Server error while connecting.' }, 500);
  }
};

connectionsRouter.post('/add', handleAddConnection);
connectionsRouter.post('/', handleAddConnection);
