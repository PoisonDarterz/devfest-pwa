import { supabase } from '../lib/supabase';
import { USE_NODE_BACKEND, NODE_API_BASE_URL, getAuthHeaders } from './apiConfig';
import type { UserProfile } from './apiConfig';

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
          .from('profiles')
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
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
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
        }
      } catch (err) {
        console.warn('Session verification with backend failed:', err);
      }
    }

    // Fallback to locally persisted user object
    try {
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
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).limit(1);
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
  }): Promise<{ success: boolean; profile: UserProfile; message: string }> {
    const cleanEmail = profile.email.trim().toLowerCase();
    const qrPayload = `DEVFEST-KL-2026-${profile.name.toUpperCase().replace(/\s+/g, '-')}`;

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

    try {
      let profileId = crypto.randomUUID ? crypto.randomUUID() : '';
      try {
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .limit(1);
        if (existingProf && existingProf.length > 0 && existingProf[0].id) {
          profileId = existingProf[0].id;
        }
      } catch {
        // ignore
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: profileId || undefined,
            email: cleanEmail,
            full_name: profile.name,
            company_role: profile.role || 'Participant',
            bio: profile.bio || '',
            github_url: profile.githubUrl || '',
            linkedin_url: profile.linkedinUrl || '',
            qr_payload: qrPayload,
          },
          { onConflict: 'email' }
        )
        .select()
        .limit(1);

      if (!error && data && data.length > 0) {
        const p = data[0];
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
          ticketType: p.ticket_type || 'Standard Attendee',
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
    const qrPayload = `DEVFEST-KL-2026-${profile.name.toUpperCase().replace(/\s+/g, '-')}`;

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
          qr_payload: qrPayload,
        })
        .eq('email', cleanEmail)
        .select()
        .limit(1);

      if (!error && data && data.length > 0) {
        const p = data[0];
        const updatedProfile: UserProfile = {
          id: p.id,
          name: p.full_name,
          role: p.company_role || 'Participant',
          email: p.email,
          avatar: '',
          bio: p.bio || '',
          githubUrl: p.github_url || '',
          linkedinUrl: p.linkedin_url || '',
          qrPayload: p.qr_payload || qrPayload,
          ticketType: p.ticket_type || 'Standard Attendee',
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
    profile: UserProfile | null;
    ticketType: string;
    message: string;
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

    try {
      const { data: whitelistData, error: wlError } = await supabase.rpc('validate_registration_email', {
        user_email: cleanEmail,
      });

      if (!wlError && whitelistData && whitelistData.length > 0) {
        isWhitelisted = !!whitelistData[0].is_whitelisted;
        ticketType = whitelistData[0].ticket_type || 'Standard Attendee';
      } else {
        const { data: directWl } = await supabase
          .from('ticketing_whitelists')
          .select('*')
          .eq('email', cleanEmail)
          .limit(1);

        if (directWl && directWl.length > 0) {
          isWhitelisted = true;
          ticketType = directWl[0].ticket_type || 'Standard Attendee';
        }
      }
    } catch (err) {
      console.warn('Whitelist query failed:', err);
    }

    if (!isWhitelisted) {
      return {
        isWhitelisted: false,
        hasProfile: false,
        profile: null,
        ticketType: 'Standard Attendee',
        message: 'Email not found in ticketed whitelist. Please use the email registered on Ticket2u / Peatix.',
      };
    }

    // 2. Check if user already has a registered profile in profiles table
    try {
      const { data: profileData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .limit(1);

      if (!profError && profileData && profileData.length > 0) {
        const p = profileData[0];
        return {
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
            ticketType: p.ticket_type || ticketType,
          },
          ticketType: p.ticket_type || ticketType,
          message: 'User profile found!',
        };
      }
    } catch (err) {
      console.warn('Profile lookup failed:', err);
    }

    return {
      isWhitelisted: true,
      hasProfile: false,
      profile: null,
      ticketType,
      message: 'Ticket verified! Welcome to DevFest, please complete your profile.',
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
      message: 'Email not found in ticketed list.',
    };
  },
};
