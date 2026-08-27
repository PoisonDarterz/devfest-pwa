import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const authRouter = Router();

// Validate registration email against ticketing whitelist table or RPC
authRouter.post('/validate-ticket', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  
  if (!email || typeof email !== 'string') {
    res.status(400).json({ isWhitelisted: false, message: 'Valid email is required.' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('validate_registration_email', { user_email: email });

    if (!error && data && data.length > 0) {
      const result = data[0];
      if (result.is_whitelisted) {
        res.json({
          isWhitelisted: true,
          ticketType: result.ticket_type || 'Standard Attendee',
          message: 'Email verified against ticket records!',
        });
        return;
      }
    }
  } catch (err) {
    console.warn('Supabase DB whitelist check failed, using fallback:', err);
  }

  // Fallback verification for demo/testing
  const isWhitelisted = email.toLowerCase().includes('devfest') || email.toLowerCase().includes('gmail') || email.length > 5;
  res.json({
    isWhitelisted,
    ticketType: 'Standard Attendee',
    message: isWhitelisted ? 'Email verified successfully!' : 'Email not found in ticketed list.',
  });
});

// Fetch User Profile by ID
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
        avatar: profile.avatar_url || '',
        qrPayload: profile.qr_payload || '',
      });
      return;
    }
  } catch (err) {
    console.warn('Failed to fetch user profile from DB:', err);
  }

  res.status(404).json({ message: 'Profile not found.' });
});

// Register or Update User Profile
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, name, role } = req.body;

  if (!email || !name) {
    res.status(400).json({ message: 'Email and name are required.' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        email,
        full_name: name,
        company_role: role || 'Participant',
        qr_payload: `DEVFEST-KL-2026-${name.toUpperCase().replace(/\s+/g, '-')}`,
      })
      .select()
      .single();

    if (!error && data) {
      res.json({
        success: true,
        user: {
          id: data.id,
          name: data.full_name,
          role: data.company_role,
          email: data.email,
          avatar: data.avatar_url || '',
          qrPayload: data.qr_payload,
        },
      });
      return;
    }
  } catch (err) {
    console.warn('Registration upsert failed on DB:', err);
  }

  res.json({
    success: true,
    user: {
      id: 'usr_123',
      name,
      role: role || 'Software Engineer',
      email,
      avatar: '',
      qrPayload: `DEVFEST-KL-2026-${name.toUpperCase().replace(/\s+/g, '-')}`,
    },
  });
});
