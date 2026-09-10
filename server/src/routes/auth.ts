import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'devfest-kl-2026-super-secret-jwt-key';

// Helper to generate JWT Token
const generateToken = (user: { id: string; email: string; name: string; role?: string }) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'Participant',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to check if email is on the ticketed whitelist
const checkWhitelistInDb = async (cleanEmail: string): Promise<{ isWhitelisted: boolean; ticketType: string; externalRefId?: string }> => {
  try {
    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('validate_registration_email', { user_email: cleanEmail });
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

  try {
    const { data: directWl, error: directErr } = await supabaseAdmin
      .from('ticketing_whitelists')
      .select('*')
      .eq('email', cleanEmail)
      .limit(1);

    if (!directErr && directWl && directWl.length > 0) {
      return {
        isWhitelisted: true,
        ticketType: directWl[0].ticket_type || 'Standard Attendee',
        externalRefId: directWl[0].external_ref_id,
      };
    }
  } catch (err) {
    console.warn('Direct ticketing_whitelists check error:', err);
  }

  return { isWhitelisted: false, ticketType: 'Standard Attendee' };
};

// =============================================================================
// 1. Validate Registration Email Whitelist
// =============================================================================
authRouter.post('/validate-ticket', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ isWhitelisted: false, message: 'Valid email is required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const { isWhitelisted, ticketType } = await checkWhitelistInDb(cleanEmail);

  if (isWhitelisted) {
    res.json({
      isWhitelisted: true,
      ticketType,
      message: 'Email verified against ticket records!',
    });
  } else {
    res.json({
      isWhitelisted: false,
      ticketType: null,
      message: 'Email not found in ticketed whitelist. Please use the email registered on Ticket2u / Peatix.',
    });
  }
});

// =============================================================================
// 2. Check User Whitelist & Profile Status
// =============================================================================
authRouter.post('/check-status', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ isWhitelisted: false, hasProfile: false, message: 'Valid email is required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const { isWhitelisted, ticketType } = await checkWhitelistInDb(cleanEmail);

  if (!isWhitelisted) {
    res.json({
      isWhitelisted: false,
      hasProfile: false,
      profile: null,
      ticketType: 'Standard Attendee',
      message: 'Email not found in ticketed whitelist. Please use the email registered on Ticket2u / Peatix.',
    });
    return;
  }

  // Check Supabase database directly for registered profile
  try {
    const { data: profData, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .limit(1);

    if (!profErr && profData && profData.length > 0) {
      const p = profData[0];
      res.json({
        isWhitelisted: true,
        hasProfile: true,
        profile: {
          id: p.id,
          name: p.full_name,
          role: p.company_role || 'Participant',
          email: p.email,
          avatar: '',
          bio: p.bio || '',
          githubUrl: p.github_url || '',
          linkedinUrl: p.linkedin_url || '',
          qrPayload: p.qr_payload || '',
        },
        ticketType: p.ticket_type || ticketType,
        message: 'User profile found in database!',
      });
      return;
    }
  } catch (err) {
    console.error('Profile DB lookup error in /check-status:', err);
  }

  // Whitelisted but profile is NOT registered yet in database
  res.json({
    isWhitelisted: true,
    hasProfile: false,
    profile: null,
    ticketType,
    message: 'Ticket verified! Please complete your registration.',
  });
});

// =============================================================================
// 3. User Login with Email & Password
// =============================================================================
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .limit(1);

    if (error) {
      res.status(500).json({ message: `Database query failed: ${error.message}` });
      return;
    }

    if (!data || data.length === 0) {
      res.status(404).json({ message: 'No registered profile found with this email. Please register first.' });
      return;
    }

    const p = data[0];

    // Verify password if password_hash exists
    if (p.password_hash) {
      const isMatch = await bcrypt.compare(password, p.password_hash);
      if (!isMatch) {
        res.status(401).json({ message: 'Incorrect password. Please try again.' });
        return;
      }
    }

    const user = {
      id: p.id,
      name: p.full_name,
      role: p.company_role || 'Participant',
      email: p.email,
      avatar: '',
      bio: p.bio || '',
      githubUrl: p.github_url || '',
      linkedinUrl: p.linkedin_url || '',
      qrPayload: p.qr_payload || '',
    };

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user,
    });
  } catch (err: any) {
    console.error('Login error on database:', err);
    res.status(500).json({ message: err?.message || 'Login failed due to a server error.' });
  }
});

// =============================================================================
// 4. Register or Update User Profile (Saves directly to Supabase profiles table)
// =============================================================================
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { id, email, name, password, role, bio, githubUrl, linkedinUrl } = req.body;

  if (!email || !name) {
    res.status(400).json({ message: 'Email and name are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Verify that email is on the ticketed whitelist
  const { isWhitelisted, ticketType } = await checkWhitelistInDb(cleanEmail);
  if (!isWhitelisted) {
    res.status(403).json({
      success: false,
      message: 'This email is not on the ticketed whitelist. Please use the email registered on Ticket2u or Peatix.',
    });
    return;
  }

  // 2. Hash password if provided
  let passwordHash: string | null = null;
  if (password && typeof password === 'string' && password.trim().length > 0) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  // 3. Determine UUID: Check if passed, exists in DB, or create auth user in Supabase
  let profileId: string | null = id || null;
  if (!profileId) {
    try {
      const { data: existingProf } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .limit(1);

      if (existingProf && existingProf.length > 0 && existingProf[0].id) {
        profileId = existingProf[0].id;
      }
    } catch (err) {
      console.warn('Error checking existing profile ID:', err);
    }
  }

  // If new user, create record in auth.users via signUp to satisfy profiles_id_fkey
  if (!profileId) {
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.signUp({
        email: cleanEmail,
        password: password || 'DevFest2026Secure!',
      });
      if (!authErr && authData?.user?.id) {
        profileId = authData.user.id;
      } else {
        // If user already registered in auth.users, sign in to retrieve their auth.users id
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
    profileId = randomUUID();
  }

  const upsertData: Record<string, any> = {
    id: profileId,
    email: cleanEmail,
    full_name: name.trim(),
    company_role: role?.trim() || 'Participant',
    ticket_type: ticketType || 'Standard Attendee',
    bio: bio?.trim() || '',
    github_url: githubUrl?.trim() || '',
    linkedin_url: linkedinUrl?.trim() || '',
    qr_payload: `DEVFEST-KL-2026-${name.trim().toUpperCase().replace(/\s+/g, '-')}`,
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
      const user = {
        id: p.id,
        name: p.full_name,
        role: p.company_role || 'Participant',
        email: p.email,
        avatar: '',
        bio: p.bio || '',
        githubUrl: p.github_url || '',
        linkedinUrl: p.linkedin_url || '',
        qrPayload: p.qr_payload,
      };

      const token = generateToken(user);
      res.json({
        success: true,
        token,
        user,
        message: 'Profile successfully registered in database!',
      });
      return;
    }

    if (error) {
      console.warn('Upsert failed with password_hash, checking if column is missing:', error.message);
      // If error is password_hash missing column, retry without it
      if (error.message?.includes('password_hash')) {
        delete upsertData.password_hash;
        const { data: retryData, error: retryErr } = await supabaseAdmin
          .from('profiles')
          .upsert(upsertData, { onConflict: 'email' })
          .select()
          .limit(1);

        if (!retryErr && retryData && retryData.length > 0) {
          const p = retryData[0];
          const user = {
            id: p.id,
            name: p.full_name,
            role: p.company_role || 'Participant',
            email: p.email,
            avatar: '',
            bio: p.bio || '',
            githubUrl: p.github_url || '',
            linkedinUrl: p.linkedin_url || '',
            qrPayload: p.qr_payload,
          };
          const token = generateToken(user);
          res.json({ success: true, token, user, message: 'Profile successfully registered in database!' });
          return;
        } else if (retryErr) {
          throw retryErr;
        }
      } else {
        throw error;
      }
    }
  } catch (err: any) {
    console.error('Failed to save profile to database:', err);
    res.status(500).json({
      success: false,
      message: `Failed to save profile to database: ${err?.message || 'Database error'}. Please run the migration script in supabase/add_auth_and_saved_sessions.sql if foreign key constraint is active.`,
    });
  }
});

// =============================================================================
// 5. Get Current Logged-in User Session
// =============================================================================
authRouter.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No authentication token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const cleanEmail = decoded.email.toLowerCase();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .limit(1);

    if (!error && data && data.length > 0) {
      const p = data[0];
      res.json({
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
          qrPayload: p.qr_payload || '',
        },
      });
      return;
    }

    res.status(404).json({ message: 'User profile not found in database.' });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired session token.' });
  }
});

// =============================================================================
// 6. Fetch User Profile by ID (e.g. For Friend Scanning)
// =============================================================================
authRouter.get('/profile/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).limit(1);
    if (!error && data && data.length > 0) {
      const profile = data[0];
      res.json({
        id: profile.id,
        name: profile.full_name,
        role: profile.company_role || 'Participant',
        email: profile.email,
        avatar: '',
        bio: profile.bio || '',
        githubUrl: profile.github_url || '',
        linkedinUrl: profile.linkedin_url || '',
        qrPayload: profile.qr_payload || '',
      });
      return;
    }
  } catch (err) {
    console.warn('Failed to fetch user profile from DB:', err);
  }

  res.status(404).json({ message: 'Profile not found.' });
});
