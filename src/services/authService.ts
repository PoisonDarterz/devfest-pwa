import { supabase } from '../lib/supabase';
import { USE_NODE_BACKEND, NODE_API_BASE_URL, getAuthHeaders, handleAuthUnauthorized } from './apiConfig';
import type { UserProfile } from './apiConfig';

export function generateAttendeeQrPayload(name: string): string {
  const nameSlug = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'ATTENDEE';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEVFEST-KL-2026-${nameSlug}-${suffix}`;
}

export const authService = {
  // Fetch Current User Profile
  async getUserProfile(email?: string): Promise<UserProfile | null> {
    const targetEmail = email ? email.trim().toLowerCase() : null;

    if (targetEmail) {
      if (USE_NODE_BACKEND) {
        try {
          const res = await fetch(`${NODE_API_BASE_URL}/auth/check-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              return {
                ...data.profile,
                ticketType: data.profile.ticketType || data.ticketType || 'Standard Attendee',
              };
            }
          }
        } catch (err) {
          console.warn('Node backend fetch failed for user profile by email:', err);
        }
      }

      try {
        const { data, error } = await supabase
          .from('vw_profiles')
          .select('*')
          .eq('email', targetEmail)
          .limit(1);

        if (!error && data && data.length > 0) {
          const p = data[0];
          return {
            id: p.id,
            name: p.full_name,
            role: p.company_role || 'Participant',
            email: p.email,
            avatar: '',
            bio: p.bio || '',
            githubUrl: p.github_url || '',
            linkedinUrl: p.linkedin_url || '',
            qrPayload: p.qr_payload || '',
            ticketType: p.ticket_type || 'Standard Attendee',
          };
        }
      } catch (err) {
        console.error('Database query failed for user profile by email:', err);
      }
    } else {
      // Fallback when no email is provided: try session token
      const sessionUser = await authService.getCurrentUser();
      if (sessionUser) return sessionUser;

      try {
        const { data, error } = await supabase.from('vw_profiles').select('*').limit(1);
        if (!error && data && data.length > 0) {
          const p = data[0];
          return {
            id: p.id,
            name: p.full_name,
            role: p.company_role || 'Participant',
            email: p.email,
            avatar: '',
            bio: p.bio || '',
            githubUrl: p.github_url || '',
            linkedinUrl: p.linkedin_url || '',
            qrPayload: p.qr_payload || '',
            ticketType: p.ticket_type || 'Standard Attendee',
          };
        }
      } catch (err) {
        console.error('Database query failed for user profile:', err);
      }
    }
    return null;
  },

  // Log In User with Email & Password
  async loginUser(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: UserProfile;
    token?: string;
    message?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.user) {
          if (data.token) {
            localStorage.setItem('devfest_auth_token', data.token);
          }
          localStorage.setItem('devfest_auth_user', JSON.stringify(data.user));
          return { success: true, user: data.user, token: data.token };
        } else {
          return { success: false, message: data.message || 'Login failed.' };
        }
      } catch (err) {
        console.warn('Node backend login failed, falling back to local verification:', err);
      }
    }

    // Direct database/demo fallback
    const status = await authService.checkUserStatus(cleanEmail);
    if (status.hasProfile && status.profile) {
      localStorage.setItem('devfest_auth_user', JSON.stringify(status.profile));
      return { success: true, user: status.profile };
    }

    return { success: false, message: 'Invalid credentials or user not found.' };
  },

  // Get Current Logged-in User Session
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = localStorage.getItem('devfest_auth_token');

    if (token && USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            localStorage.setItem('devfest_auth_user', JSON.stringify(data.user));
            return data.user;
          }
        } else if (res.status === 401 || res.status === 403) {
          console.warn('[Auth] Session token is invalid or expired. Purging stored credentials.');
          handleAuthUnauthorized();
          return null;
        }
      } catch (err) {
        console.warn('Session verification with backend failed:', err);
      }
    }

    // Fallback: only if user has no token or backend is disabled
    try {
      const storedToken = localStorage.getItem('devfest_auth_token');
      // If token was present and purged by 401, do not restore stale user!
      if (token && !storedToken) {
        return null;
      }
      const stored = localStorage.getItem('devfest_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Fetch Profile by ID (e.g. Discovered Friend)
  async getProfileById(id: string): Promise<UserProfile | null> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/profile/${id}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('Node backend fetch failed for profile by ID:', err);
      }
    }

    try {
      const { data, error } = await supabase.from('vw_profiles').select('*').eq('id', id).limit(1);
      if (!error && data && data.length > 0) {
        const p = data[0];
        return {
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
      }
    } catch (err) {
      console.error('Database query failed for profile by ID:', err);
    }
    return null;
  },

  // Save or Update User Profile (Including Password)
  async saveUserProfile(profile: {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    ticketType?: string;
    qrPayload?: string;
  }): Promise<{ success: boolean; profile: UserProfile; message: string }> {
    const cleanEmail = profile.email.trim().toLowerCase();
    const qrPayload = profile.qrPayload || generateAttendeeQrPayload(profile.name);

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: profile.id,
            name: profile.name,
            email: cleanEmail,
            password: profile.password,
            role: profile.role,
            bio: profile.bio,
            githubUrl: profile.githubUrl,
            linkedinUrl: profile.linkedinUrl,
            qrPayload: profile.qrPayload,
          }),
        });

        const json = await res.json();
        if (res.ok && json.success && json.user) {
          if (json.token) {
            localStorage.setItem('devfest_auth_token', json.token);
          }
          localStorage.setItem('devfest_auth_user', JSON.stringify(json.user));
          return { success: true, profile: json.user, message: json.message || 'Profile registered successfully!' };
        } else {
          return {
            success: false,
            profile: null as any,
            message: json.message || 'Failed to register profile on server.',
          };
        }
      } catch (err: any) {
        console.error('Node backend save user profile failed:', err);
        return {
          success: false,
          profile: null as any,
          message: err?.message || 'Unable to reach backend server.',
        };
      }
    }

    const cleanName = profile.name.trim();
    const cleanRole = profile.role?.trim();
    const cleanBio = profile.bio?.trim();
    const cleanLinkedin = profile.linkedinUrl?.trim();
    const cleanGithub = profile.githubUrl?.trim() || '';

    if (!cleanName || !cleanEmail || !cleanRole || !cleanBio || !cleanLinkedin) {
      return {
        success: false,
        profile: null as any,
        message: 'Name, email, role, bio, and LinkedIn URL are required. GitHub is optional.',
      };
    }

    try {
      try {
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id, password_hash')
          .eq('email', cleanEmail)
          .limit(1);
        if (existingProf && existingProf.length > 0) {
          const hasPwd = !!(existingProf[0].password_hash && existingProf[0].password_hash.trim().length > 0);
          return {
            success: false,
            profile: null as any,
            message: hasPwd
              ? 'An account with this email is already registered. Please log in with your password.'
              : 'An account with this email was registered using Google. Please sign in with Google.',
          };
        }
      } catch {
        // ignore
      }

      let profileId = profile.id || (crypto.randomUUID ? crypto.randomUUID() : '');

      if (qrPayload) {
        try {
          await supabase.from('ticketing_whitelists').update({ qr_payload: qrPayload }).eq('email', cleanEmail);
        } catch {}
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: profileId || undefined,
            email: cleanEmail,
            full_name: cleanName,
            company_role: cleanRole,
            bio: cleanBio,
            github_url: cleanGithub,
            linkedin_url: cleanLinkedin,
          },
          { onConflict: 'email' }
        )
        .select()
        .limit(1);

      if (!error && data && data.length > 0) {
        const p = data[0];

        // Ensure Entry Swag reward exists for participant (Walk-in attendees do not receive entry swag)
        const isWalkIn = (profile.ticketType || '').toLowerCase().includes('walk-in');
        if (!isWalkIn) {
          try {
            const { data: existingSwag } = await supabase
              .from('user_rewards')
            .select('id')
            .eq('user_id', p.id)
            .eq('reward_type', 'entry_swag')
            .maybeSingle();

          if (!existingSwag) {
            // Generate sequential auto-incremented claim code
            const { data: allSwags } = await supabase
              .from('user_rewards')
              .select('claim_code')
              .ilike('claim_code', 'DF26-SWAG-%');

            const existingCodes = new Set<string>();
            let maxSequential = 0;
            if (allSwags && allSwags.length > 0) {
              for (const row of allSwags) {
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

            let nextNum = Math.max(maxSequential + 1, (allSwags?.length || 0) + 1);
            let claimCode = `DF26-SWAG-${String(nextNum).padStart(4, '0')}`;
            while (existingCodes.has(claimCode)) {
              nextNum++;
              claimCode = `DF26-SWAG-${String(nextNum).padStart(4, '0')}`;
            }

            await supabase.from('user_rewards').insert({
              user_id: p.id,
              reward_type: 'entry_swag',
              title: 'DevFest 2026 Welcome Swag Pack',
              subtitle: 'Official attendee tote bag, lanyard, badge & stickers.',
              description: 'Head over to the Registration Counter to claim your official DevFest Kuala Lumpur 2026 swag pack.',
              claim_code: claimCode,
              status: 'unclaimed',
            });
          }
        } catch (swagErr) {
          console.warn('Could not generate entry swag reward in fallback:', swagErr);
        }
      }

        const savedProfile: UserProfile = {
          id: p.id,
          name: p.full_name,
          role: p.company_role || 'Participant',
          email: p.email,
          avatar: '',
          bio: p.bio || '',
          githubUrl: p.github_url || '',
          linkedinUrl: p.linkedin_url || '',
          qrPayload: p.qr_payload || qrPayload,
          ticketType: profile.ticketType || 'Standard Attendee',
        };
        localStorage.setItem('devfest_auth_user', JSON.stringify(savedProfile));
        return {
          success: true,
          profile: savedProfile,
          message: 'Profile saved successfully!',
        };
      } else if (error) {
        return {
          success: false,
          profile: null as any,
          message: `Database error: ${error.message}`,
        };
      }
    } catch (err: any) {
      console.error('Database save user profile failed:', err);
      return {
        success: false,
        profile: null as any,
        message: `Database error: ${err?.message || 'Save failed'}`,
      };
    }

    return {
      success: false,
      profile: null as any,
      message: 'Failed to save profile.',
    };
  },

  // Update User Profile (Full Name, Role, Bio, GitHub URL, LinkedIn URL)
  async updateUserProfile(profile: {
    name: string;
    email: string;
    role?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  }): Promise<{ success: boolean; profile: UserProfile; message: string }> {
    const cleanEmail = profile.email.trim().toLowerCase();
    const storedUser = (() => {
      try {
        const raw = localStorage.getItem('devfest_auth_user');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();
    const qrPayload = storedUser?.qrPayload || generateAttendeeQrPayload(profile.name);

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            email: cleanEmail,
            name: profile.name,
            role: profile.role,
            bio: profile.bio,
            githubUrl: profile.githubUrl,
            linkedinUrl: profile.linkedinUrl,
          }),
        });

        if (res.status === 401 || res.status === 403) {
          handleAuthUnauthorized();
          return {
            success: false,
            profile: null as any,
            message: 'Session has expired. Please sign in again.',
          };
        }

        const json = await res.json();
        if (res.ok && json.success && json.user) {
          if (json.token) {
            localStorage.setItem('devfest_auth_token', json.token);
          }
          localStorage.setItem('devfest_auth_user', JSON.stringify(json.user));
          return { success: true, profile: json.user, message: json.message || 'Profile updated successfully!' };
        } else {
          return {
            success: false,
            profile: null as any,
            message: json.message || 'Failed to update profile on server.',
          };
        }
      } catch (err: any) {
        console.warn('Node backend update profile failed, falling back to direct database:', err);
      }
    }

    // Direct Supabase DB update fallback
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.name.trim(),
          company_role: profile.role || 'Participant',
          bio: profile.bio || '',
          github_url: profile.githubUrl || '',
          linkedin_url: profile.linkedinUrl || '',
        })
        .eq('email', cleanEmail)
        .select()
        .limit(1);

      if (!error && data && data.length > 0) {
        const p = data[0];
        let existingTicketType = 'Standard Attendee';
        let existingQrPayload = '';
        try {
          const stored = localStorage.getItem('devfest_auth_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            existingTicketType = parsed.ticketType || existingTicketType;
            existingQrPayload = parsed.qrPayload || '';
          }
        } catch {}

        // Fetch fresh Luma QR payload from vw_profiles or whitelist
        try {
          const { data: vwData } = await supabase.from('vw_profiles').select('qr_payload, ticket_type').eq('email', cleanEmail).maybeSingle();
          if (vwData?.qr_payload) existingQrPayload = vwData.qr_payload;
          if (vwData?.ticket_type) existingTicketType = vwData.ticket_type;
        } catch {}

        const updatedProfile: UserProfile = {
          id: p.id,
          name: p.full_name,
          role: p.company_role || 'Participant',
          email: p.email,
          avatar: '',
          bio: p.bio || '',
          githubUrl: p.github_url || '',
          linkedinUrl: p.linkedin_url || '',
          qrPayload: existingQrPayload || qrPayload,
          ticketType: existingTicketType,
        };
        localStorage.setItem('devfest_auth_user', JSON.stringify(updatedProfile));
        return {
          success: true,
          profile: updatedProfile,
          message: 'Profile updated successfully in database!',
        };
      }

      if (error) {
        return {
          success: false,
          profile: null as any,
          message: `Database update failed: ${error.message}`,
        };
      }
    } catch (err: any) {
      console.error('Database update failed for profile:', err);
      return {
        success: false,
        profile: null as any,
        message: err?.message || 'Database connection error.',
      };
    }

    return {
      success: false,
      profile: null as any,
      message: 'Unable to update profile.',
    };
  },

  // Check User Whitelist & Profile Status
  async checkUserStatus(email: string): Promise<{
    isWhitelisted: boolean;
    hasProfile: boolean;
    hasPassword?: boolean;
    profile: UserProfile | null;
    ticketType: string;
    message: string;
    prefill?: {
      name?: string;
      role?: string;
      jobTitle?: string;
      company?: string;
      ticketType?: string;
      qrPayload?: string;
      externalRefId?: string;
    };
  }> {
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/check-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            data.profile.ticketType = data.profile.ticketType || data.ticketType || 'Standard Attendee';
          }
          return data;
        }
      } catch (err) {
        console.warn('Node backend check-status failed, falling back to direct Supabase:', err);
      }
    }

    // 1. Check whitelist in database
    let isWhitelisted = false;
    let ticketType = 'Standard Attendee';
    let prefill: {
      name?: string;
      role?: string;
      jobTitle?: string;
      company?: string;
      ticketType?: string;
      qrPayload?: string;
      externalRefId?: string;
    } | undefined = undefined;

    try {
      const { data: directWl } = await supabase
        .from('ticketing_whitelists')
        .select('*')
        .eq('email', cleanEmail)
        .limit(1);

      if (directWl && directWl.length > 0) {
        const wl = directWl[0];
        isWhitelisted = true;
        ticketType = wl.ticket_type || 'Standard Attendee';
        const rolePrefill = [wl.job_title, wl.company].filter(Boolean).join(' at ') || 'Participant';
        prefill = {
          name: wl.full_name || '',
          jobTitle: wl.job_title || '',
          company: wl.company || '',
          role: rolePrefill,
          ticketType: wl.ticket_type || 'Standard Attendee',
          qrPayload: wl.qr_payload || '',
          externalRefId: wl.external_ref_id || '',
        };
      } else {
        const { data: whitelistData, error: wlError } = await supabase.rpc('validate_registration_email', {
          user_email: cleanEmail,
        });

        if (!wlError && whitelistData && whitelistData.length > 0 && whitelistData[0].is_whitelisted) {
          isWhitelisted = true;
          ticketType = whitelistData[0].ticket_type || 'Standard Attendee';
          prefill = {
            ticketType,
            externalRefId: whitelistData[0].external_ref_id || '',
          };
        }
      }
    } catch (err) {
      console.warn('Whitelist query failed:', err);
    }

    if (!isWhitelisted) {
      return {
        isWhitelisted: false,
        hasProfile: false,
        hasPassword: false,
        profile: null,
        ticketType: 'Standard Attendee',
        message: 'Email not found in ticketed whitelist. Please use the email registered on Peatix, or refer to the DevFest registration booth to check your registration details.',
      };
    }

    // 2. Check if user already has a registered profile in vw_profiles
    try {
      const { data: profileData, error: profError } = await supabase
        .from('vw_profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .limit(1);

      if (!profError && profileData && profileData.length > 0) {
        const p = profileData[0];
        const hasPwd = !!(p.password_hash && p.password_hash.trim().length > 0);
        return {
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
            qrPayload: p.qr_payload || '',
            ticketType: p.ticket_type || ticketType,
          },
          ticketType: p.ticket_type || ticketType,
          message: 'User profile found!',
          prefill,
        };
      }
    } catch (err) {
      console.warn('Profile lookup failed:', err);
    }

    return {
      isWhitelisted: true,
      hasProfile: false,
      hasPassword: false,
      profile: null,
      ticketType,
      message: 'Ticket verified! Welcome to DevFest, please complete your profile.',
      prefill,
    };
  },

  // Validate Email Whitelist
  async validateEmailWhitelist(email: string): Promise<{ isWhitelisted: boolean; ticketType: string; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/validate-ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('Node backend whitelist validation failed:', err);
      }
    }

    try {
      const { data, error } = await supabase.rpc('validate_registration_email', { user_email: cleanEmail });
      if (!error && data && data.length > 0 && data[0].is_whitelisted) {
        const res = data[0];
        return {
          isWhitelisted: true,
          ticketType: res.ticket_type || 'Standard Attendee',
          message: 'Email verified against ticket records!',
        };
      }
    } catch (err) {
      console.error('Email whitelist validation failed:', err);
    }

    try {
      const { data: directWl } = await supabase
        .from('ticketing_whitelists')
        .select('*')
        .eq('email', cleanEmail)
        .limit(1);

      if (directWl && directWl.length > 0) {
        return {
          isWhitelisted: true,
          ticketType: directWl[0].ticket_type || 'Standard Attendee',
          message: 'Email verified against ticket records!',
        };
      }
    } catch (err) {
      console.error('Direct whitelist table check failed:', err);
    }

    return {
      isWhitelisted: false,
      ticketType: 'Standard Attendee',
      message: 'Email not found in ticketed list. Please refer to the DevFest registration booth to check your registration details.',
    };
  },
};
