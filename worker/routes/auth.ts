import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin, getJwtSecret } from '../db';
import type { Env } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

export const authRouter = new Hono<{ Bindings: Env }>();

// Helper to generate JWT Token (7 days expiry)
const generateToken = async (
  user: { id: string; email: string; name: string; role?: string },
  secret: string
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  return await sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'Participant',
      iat: now,
      exp: now + 60 * 60 * 24 * 7,
    },
    secret
  );
};

// Helper to check if email is on the ticketed whitelist
export const checkWhitelistInDb = async (
  supabaseAdmin: SupabaseClient,
  cleanEmail: string
): Promise<{
  isWhitelisted: boolean;
  ticketType: string;
  externalRefId?: string;
  qrPayload?: string;
  fullName?: string;
  jobTitle?: string;
  company?: string;
}> => {
  try {
    const { data: directWl, error: directErr } = await supabaseAdmin
      .from('ticketing_whitelists')
      .select('*')
      .ilike('email', cleanEmail)
      .limit(1);

    if (!directErr && directWl && directWl.length > 0) {
      const row = directWl[0];
      return {
        isWhitelisted: true,
        ticketType: row.ticket_type || 'Standard Attendee',
        externalRefId: row.external_ref_id,
        qrPayload: row.qr_payload,
        fullName: row.full_name,
        jobTitle: row.job_title,
        company: row.company,
      };
    }
  } catch (err) {
    console.warn('Direct ticketing_whitelists check error:', err);
  }

  try {
    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('validate_registration_email', {
      user_email: cleanEmail,
    });
    if (!rpcErr && rpcData && rpcData.length > 0 && rpcData[0].is_whitelisted) {
      return {
        isWhitelisted: true,
        ticketType: rpcData[0].ticket_type || 'Standard Attendee',
        externalRefId: rpcData[0].external_ref_id,
      };
    }
  } catch (err) {
    console.warn('RPC validate_registration_email error:', err);
  }

  return { isWhitelisted: false, ticketType: 'Standard Attendee' };
};

// Helper to generate attendee QR payload with guaranteed unique collision-free suffix
export function generateAttendeeQrPayload(name: string): string {
  const nameSlug =
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'ATTENDEE';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEVFEST-KL-2026-${nameSlug}-${suffix}`;
}

// Helper to generate auto-incremented sequential reward claim codes (e.g. DF26-SWAG-0001, DF26-BOX-0001)
export async function getNextRewardClaimCode(
  supabaseAdmin: SupabaseClient,
  prefix = 'DF26-SWAG'
): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('user_rewards')
      .select('claim_code')
      .ilike('claim_code', `${prefix}-%`);

    const existingCodes = new Set<string>();
    let maxSequential = 0;

    if (data && data.length > 0) {
      for (const row of data) {
        const code = (row.claim_code || '').trim();
        existingCodes.add(code);

        const match = code.match(/-0*(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num < 1000 && num > maxSequential) {
            maxSequential = num;
          }
        }
      }
    }

    let nextNum = Math.max(maxSequential + 1, (data?.length || 0) + 1);
    let candidate = `${prefix}-${String(nextNum).padStart(4, '0')}`;

    while (existingCodes.has(candidate)) {
      nextNum++;
      candidate = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    }

    return candidate;
  } catch (err) {
    console.warn('Error generating sequential reward claim code:', err);
    return `${prefix}-${String(Date.now()).slice(-4)}`;
  }
}

// Helper: Ensure Entry Swag reward exists for a registered participant
export async function ensureEntrySwagReward(
  supabaseAdmin: SupabaseClient,
  userId: string,
  ticketType?: string
): Promise<void> {
  try {
    let resolvedTicketType = ticketType;
    if (!resolvedTicketType) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();
      if (prof?.email) {
        resolvedTicketType = (await checkWhitelistInDb(supabaseAdmin, prof.email)).ticketType;
      }
    }

    // Walk-in participants do not receive an entry swag pack
    if (resolvedTicketType && resolvedTicketType.toLowerCase().includes('walk-in')) {
      return;
    }

    const { data: existing } = await supabaseAdmin
      .from('user_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('reward_type', 'entry_swag')
      .maybeSingle();

    if (!existing) {
      const claimCode = await getNextRewardClaimCode(supabaseAdmin, 'DF26-SWAG');
      await supabaseAdmin.from('user_rewards').insert({
        user_id: userId,
        reward_type: 'entry_swag',
        title: 'DevFest 2026 Welcome Swag Pack',
        subtitle: 'Official attendee tote bag, lanyard, badge & stickers.',
        description:
          'Head over to the Registration Counter to claim your official DevFest Kuala Lumpur 2026 swag pack.',
        claim_code: claimCode,
        status: 'unclaimed',
      });
    }
  } catch (err) {
    console.warn('Could not generate entry swag reward:', err);
  }
}

// =============================================================================
// 1. Validate Registration Email Whitelist
// =============================================================================
authRouter.post('/validate-ticket', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { email } = body;

  if (!email || typeof email !== 'string') {
    return c.json({ isWhitelisted: false, message: 'Valid email is required.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  const { isWhitelisted, ticketType } = await checkWhitelistInDb(supabaseAdmin, cleanEmail);

  if (isWhitelisted) {
    return c.json({
      isWhitelisted: true,
      ticketType,
      message: 'Email verified against ticket records!',
    });
  } else {
    return c.json({
      isWhitelisted: false,
      ticketType: null,
      message:
        'Email not found in ticketed whitelist. Please use the email registered on Peatix, or refer to the DevFest registration booth to check your registration details.',
    });
  }
});

// =============================================================================
// 2. Check User Whitelist & Profile Status
// =============================================================================
authRouter.post('/check-status', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { email } = body;

  if (!email || typeof email !== 'string') {
    return c.json({ isWhitelisted: false, hasProfile: false, message: 'Valid email is required.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  const wl = await checkWhitelistInDb(supabaseAdmin, cleanEmail);

  if (!wl.isWhitelisted) {
    return c.json({
      isWhitelisted: false,
      hasProfile: false,
      profile: null,
      ticketType: 'Standard Attendee',
      message:
        'Email not found in ticketed whitelist. Please use the email registered on Luma, or refer to the DevFest registration booth to check your registration details.',
    });
  }

  try {
    const { data: profData, error: profErr } = await supabaseAdmin
      .from('vw_profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .limit(1);

    if (!profErr && profData && profData.length > 0) {
      const p = profData[0];
      const hasPwd = !!(p.password_hash && p.password_hash.trim().length > 0);
      return c.json({
        isWhitelisted: true,
        hasProfile: true,
        hasPassword: hasPwd,
        profile: {
          id: p.id,
          name: p.full_name,
          role: p.company_role || 'Participant',
          email: p.email,
          avatar: '',
          bio: p.bio || '',
          githubUrl: p.github_url || '',
          linkedinUrl: p.linkedin_url || '',
          qrPayload: p.qr_payload || wl.qrPayload || '',
          ticketType: p.ticket_type || wl.ticketType || 'Standard Attendee',
        },
        ticketType: p.ticket_type || wl.ticketType || 'Standard Attendee',
        message: 'User profile found in database!',
      });
    }
  } catch (err) {
    console.error('Profile DB lookup error in /check-status:', err);
  }

  const prefillRole = wl.jobTitle
    ? wl.company
      ? `${wl.jobTitle} @ ${wl.company}`
      : wl.jobTitle
    : wl.company || '';

  return c.json({
    isWhitelisted: true,
    hasProfile: false,
    hasPassword: false,
    profile: null,
    ticketType: wl.ticketType,
    prefill: {
      name: wl.fullName || '',
      role: prefillRole,
      jobTitle: wl.jobTitle || '',
      company: wl.company || '',
      ticketType: wl.ticketType,
      qrPayload: wl.qrPayload || '',
      externalRefId: wl.externalRefId || '',
    },
    message: 'Ticket verified! Please complete your registration.',
  });
});

// =============================================================================
// 3. User Login with Email & Password
// =============================================================================
authRouter.post('/login', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const jwtSecret = getJwtSecret(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ message: 'Email and password are required.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabaseAdmin
      .from('vw_profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .limit(1);

    if (error) {
      return c.json({ message: `Database query failed: ${error.message}` }, 500);
    }

    if (!data || data.length === 0) {
      return c.json({ message: 'No registered profile found with this email. Please register first.' }, 404);
    }

    const p = data[0];

    if (!p.password_hash) {
      return c.json(
        {
          message: 'This account was registered using Google. Please sign in with Google.',
        },
        400
      );
    }

    const isMatch = await bcrypt.compare(password, p.password_hash);
    if (!isMatch) {
      return c.json({ message: 'Incorrect password. Please try again.' }, 401);
    }

    const { ticketType, qrPayload: wlQr } = await checkWhitelistInDb(supabaseAdmin, cleanEmail);

    const user = {
      id: p.id,
      name: p.full_name,
      role: p.company_role || 'Participant',
      email: p.email,
      avatar: '',
      bio: p.bio || '',
      githubUrl: p.github_url || '',
      linkedinUrl: p.linkedin_url || '',
      qrPayload: p.qr_payload || wlQr || '',
      ticketType: p.ticket_type || ticketType || 'Standard Attendee',
    };

    const token = await generateToken(user, jwtSecret);
    return c.json({
      success: true,
      token,
      user,
    });
  } catch (err: any) {
    console.error('Login error on database:', err);
    return c.json({ message: err?.message || 'Login failed due to a server error.' }, 500);
  }
});

// =============================================================================
// 4. Register or Update User Profile (Saves directly to Supabase profiles table)
// =============================================================================
authRouter.post('/register', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const jwtSecret = getJwtSecret(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { id, email, name, password, role, bio, githubUrl, linkedinUrl, qrPayload } = body;

  if (!email?.trim() || !name?.trim() || !role?.trim() || !bio?.trim() || !linkedinUrl?.trim()) {
    return c.json(
      {
        message: 'Name, email, role, bio, and LinkedIn URL are required. GitHub is optional.',
      },
      400
    );
  }

  if (!id && (!password || typeof password !== 'string' || password.trim().length === 0)) {
    return c.json({ message: 'Password is required for account creation.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Verify that email is on the ticketed whitelist
  const wl = await checkWhitelistInDb(supabaseAdmin, cleanEmail);
  const { isWhitelisted, ticketType } = wl;
  if (!isWhitelisted) {
    return c.json(
      {
        success: false,
        message:
          'This email is not on the ticketed whitelist. Please use the email registered on Luma, or refer to the DevFest registration booth to check your registration details.',
      },
      403
    );
  }

  // 1.5. Prevent duplicate registration
  try {
    const { data: existingProf, error: existErr } = await supabaseAdmin
      .from('profiles')
      .select('id, password_hash')
      .eq('email', cleanEmail)
      .limit(1);

    if (!existErr && existingProf && existingProf.length > 0) {
      const hasPwd = !!(existingProf[0].password_hash && existingProf[0].password_hash.trim().length > 0);
      return c.json(
        {
          success: false,
          alreadyRegistered: true,
          hasPassword: hasPwd,
          message: hasPwd
            ? 'An account with this email is already registered. Please log in with your password.'
            : 'An account with this email was registered using Google. Please sign in with Google.',
        },
        409
      );
    }
  } catch (err) {
    console.warn('Error checking existing profile during registration:', err);
  }

  // 2. Hash password if provided
  let passwordHash: string | null = null;
  if (password && typeof password === 'string' && password.trim().length > 0) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  // 3. Determine UUID
  let profileId: string | null = id || null;

  if (!profileId) {
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.signUp({
        email: cleanEmail,
        password: password || 'DevFest2026Secure!',
      });
      if (!authErr && authData?.user?.id) {
        profileId = authData.user.id;
      } else {
        const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
          email: cleanEmail,
          password: password || 'DevFest2026Secure!',
        });
        if (signInData?.user?.id) {
          profileId = signInData.user.id;
        }
      }
    } catch (authErr) {
      console.warn('Supabase Auth attempt (non-fatal):', authErr);
    }
  }

  if (!profileId) {
    profileId = crypto.randomUUID();
  }

  const resolvedQrPayload = qrPayload?.trim() || wl.qrPayload || generateAttendeeQrPayload(name);

  // If whitelist entry exists without a qr_payload, update whitelist with the resolved Luma/generated QR
  if (!wl.qrPayload && resolvedQrPayload) {
    try {
      await supabaseAdmin
        .from('ticketing_whitelists')
        .update({ qr_payload: resolvedQrPayload })
        .eq('email', cleanEmail);
    } catch (e) {
      console.warn('Could not update whitelist qr_payload:', e);
    }
  }

  const upsertData: Record<string, any> = {
    id: profileId,
    email: cleanEmail,
    full_name: name.trim(),
    company_role: role.trim(),
    bio: bio.trim(),
    github_url: githubUrl?.trim() || '',
    linkedin_url: linkedinUrl.trim(),
    is_ticket_verified: true,
  };

  if (passwordHash) {
    upsertData.password_hash = passwordHash;
  }

  // 4. Save directly to Supabase public.profiles table
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(upsertData, { onConflict: 'email' })
      .select()
      .limit(1);

    if (!error && data && data.length > 0) {
      const p = data[0];
      await ensureEntrySwagReward(supabaseAdmin, p.id, ticketType);
      const user = {
        id: p.id,
        name: p.full_name,
        role: p.company_role || 'Participant',
        email: p.email,
        avatar: '',
        bio: p.bio || '',
        githubUrl: p.github_url || '',
        linkedinUrl: p.linkedin_url || '',
        qrPayload: wl.qrPayload || resolvedQrPayload,
        ticketType: ticketType || 'Standard Attendee',
      };

      const token = await generateToken(user, jwtSecret);
      return c.json({
        success: true,
        token,
        user,
        message: 'Profile successfully registered in database!',
      });
    }

    if (error) {
      console.warn('Upsert failed with password_hash, checking if column is missing:', error.message);
      if (error.message?.includes('password_hash')) {
        delete upsertData.password_hash;
        const { data: retryData, error: retryErr } = await supabaseAdmin
          .from('profiles')
          .upsert(upsertData, { onConflict: 'email' })
          .select()
          .limit(1);

        if (!retryErr && retryData && retryData.length > 0) {
          const p = retryData[0];
          await ensureEntrySwagReward(supabaseAdmin, p.id, ticketType);
          const user = {
            id: p.id,
            name: p.full_name,
            role: p.company_role || 'Participant',
            email: p.email,
            avatar: '',
            bio: p.bio || '',
            githubUrl: p.github_url || '',
            linkedinUrl: p.linkedin_url || '',
            qrPayload: wl.qrPayload || resolvedQrPayload,
            ticketType: ticketType || 'Standard Attendee',
          };
          const token = await generateToken(user, jwtSecret);
          return c.json({
            success: true,
            token,
            user,
            message: 'Profile successfully registered in database!',
          });
        } else if (retryErr) {
          throw retryErr;
        }
      } else {
        throw error;
      }
    }
  } catch (err: any) {
    console.error('Failed to save profile to database:', err);
    return c.json(
      {
        success: false,
        message: `Failed to save profile to database: ${err?.message || 'Database error'}. Please run the migration script in supabase/add_auth_and_saved_sessions.sql if foreign key constraint is active.`,
      },
      500
    );
  }

  return c.json({ success: false, message: 'Failed to register profile.' }, 500);
});

// =============================================================================
// 5. Get Current Logged-in User Session
// =============================================================================
authRouter.get('/me', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const jwtSecret = getJwtSecret(c.env);
  const authHeader = c.req.header('authorization') || c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'No authentication token provided.' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = (await verify(token, jwtSecret, 'HS256')) as { id: string; email: string };
    const cleanEmail = decoded.email.toLowerCase();

    const { data, error } = await supabaseAdmin
      .from('vw_profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .limit(1);

    if (!error && data && data.length > 0) {
      const p = data[0];
      const { ticketType, qrPayload: wlQr } = await checkWhitelistInDb(supabaseAdmin, cleanEmail);
      return c.json({
        success: true,
        user: {
          id: p.id,
          name: p.full_name,
          role: p.company_role || 'Participant',
          email: p.email,
          avatar: '',
          bio: p.bio || '',
          githubUrl: p.github_url || '',
          linkedinUrl: p.linkedin_url || '',
          qrPayload: p.qr_payload || wlQr || '',
          ticketType: p.ticket_type || ticketType || 'Standard Attendee',
        },
      });
    }

    return c.json({ message: 'User profile not found in database.' }, 404);
  } catch {
    return c.json({ message: 'Invalid or expired session token.' }, 401);
  }
});

// =============================================================================
// 6. Fetch User Profile by ID (e.g. For Friend Scanning)
// =============================================================================
authRouter.get('/profile/:id', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const id = c.req.param('id');

  try {
    const { data, error } = await supabaseAdmin.from('vw_profiles').select('*').eq('id', id).limit(1);
    if (!error && data && data.length > 0) {
      const profile = data[0];
      const { ticketType, qrPayload: wlQr } = await checkWhitelistInDb(supabaseAdmin, profile.email);
      return c.json({
        id: profile.id,
        name: profile.full_name,
        role: profile.company_role || 'Participant',
        email: profile.email,
        avatar: '',
        bio: profile.bio || '',
        githubUrl: profile.github_url || '',
        linkedinUrl: profile.linkedin_url || '',
        qrPayload: profile.qr_payload || wlQr || '',
        ticketType: profile.ticket_type || ticketType || 'Standard Attendee',
      });
    }
  } catch (err) {
    console.warn('Failed to fetch user profile from DB:', err);
  }

  return c.json({ message: 'Profile not found.' }, 404);
});

// =============================================================================
// 7. Update User Profile in Database
// =============================================================================
const handleUpdateProfile = async (c: any) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const jwtSecret = getJwtSecret(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { email, name, role, bio, githubUrl, linkedinUrl } = body;

  if (!email || typeof email !== 'string') {
    return c.json({ success: false, message: 'Valid email is required to update profile.' }, 400);
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return c.json({ success: false, message: 'Full name is required.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data: existingProfiles, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .limit(1);

    if (fetchErr) {
      return c.json({ success: false, message: `Database error: ${fetchErr.message}` }, 500);
    }

    if (!existingProfiles || existingProfiles.length === 0) {
      return c.json({ success: false, message: 'Profile not found in database. Please register first.' }, 404);
    }

    const currentProfile = existingProfiles[0];

    const { data: updatedData, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: name.trim(),
        company_role: role?.trim() || 'Participant',
        bio: bio !== undefined ? bio.trim() : currentProfile.bio || '',
        github_url: githubUrl !== undefined ? githubUrl.trim() : currentProfile.github_url || '',
        linkedin_url: linkedinUrl !== undefined ? linkedinUrl.trim() : currentProfile.linkedin_url || '',
      })
      .eq('email', cleanEmail)
      .select()
      .limit(1);

    if (updateErr) {
      console.error('Error updating profile in Supabase:', updateErr);
      return c.json({ success: false, message: `Failed to update profile: ${updateErr.message}` }, 500);
    }

    if (!updatedData || updatedData.length === 0) {
      return c.json({ success: false, message: 'Failed to update profile: No record updated.' }, 500);
    }

    const p = updatedData[0];
    let wlQr = '';
    try {
      const { data: wlData } = await supabaseAdmin
        .from('ticketing_whitelists')
        .select('qr_payload')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (wlData?.qr_payload) wlQr = wlData.qr_payload;
    } catch {}

    const { ticketType } = await checkWhitelistInDb(supabaseAdmin, cleanEmail);

    const updatedUser = {
      id: p.id,
      name: p.full_name,
      role: p.company_role || 'Participant',
      email: p.email,
      avatar: '',
      bio: p.bio || '',
      githubUrl: p.github_url || '',
      linkedinUrl: p.linkedin_url || '',
      qrPayload: wlQr || '',
      ticketType: ticketType || 'Standard Attendee',
    };

    const token = await generateToken(updatedUser, jwtSecret);

    return c.json({
      success: true,
      token,
      user: updatedUser,
      message: 'Profile updated successfully in database!',
    });
  } catch (err: any) {
    console.error('Server error updating profile:', err);
    return c.json({ success: false, message: err?.message || 'Server error updating profile.' }, 500);
  }
};

authRouter.put('/profile', handleUpdateProfile);
authRouter.post('/profile', handleUpdateProfile);

/**
 * POST /api/auth/admin/import-whitelist
 * Bulk imports or updates attendees from Luma CSV into ticketing_whitelists
 */
authRouter.post('/admin/import-whitelist', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { items, clearExisting } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return c.json({ success: false, message: 'No attendee items provided.' }, 400);
  }

  try {
    if (clearExisting) {
      await supabaseAdmin
        .from('ticketing_whitelists')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const chunkSize = 100;
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const rows = chunk
        .map((r: any) => ({
          email: String(r.email || '').trim().toLowerCase(),
          full_name: r.full_name || null,
          external_ref_id: r.external_ref_id || null,
          qr_payload: r.qr_payload || null,
          ticket_type: r.ticket_type || 'Standard Attendee',
          job_title: r.job_title || null,
          company: r.company || null,
          tshirt_size: r.tshirt_size || null,
          notes: r.notes || 'Imported via Luma CSV',
        }))
        .filter((r: any) => r.email.includes('@'));

      const { error } = await supabaseAdmin
        .from('ticketing_whitelists')
        .upsert(rows, { onConflict: 'email' });

      if (error) {
        errors.push(`Chunk ${Math.floor(i / chunkSize) + 1}: ${error.message}`);
      } else {
        importedCount += rows.length;
      }
    }

    return c.json({
      success: importedCount > 0,
      importedCount,
      message: `Successfully imported / updated ${importedCount} attendees in whitelist!`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Error during admin whitelist import:', err);
    return c.json({ success: false, message: err?.message || 'Server error importing whitelist.' }, 500);
  }
});

/**
 * POST /api/auth/admin/clear-whitelist
 */
authRouter.post('/admin/clear-whitelist', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  try {
    const { error } = await supabaseAdmin
      .from('ticketing_whitelists')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      return c.json({ success: false, message: error.message }, 500);
    }
    return c.json({ success: true, message: 'All whitelist records cleared.' });
  } catch (err: any) {
    return c.json({ success: false, message: err?.message || 'Server error clearing whitelist.' }, 500);
  }
});
