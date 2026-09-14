import { supabase } from '../lib/supabase';
import type { Booth, Session, FAQItem, AppNotification } from '../lib/types';

export interface RewardItem {
  id: string;
  title: string;
  subtitle: string;
  isUnlocked: boolean;
  isRedeemed: boolean;
  requiredStamps: number;
  currentStamps: number;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  qrPayload: string;
}

const USE_NODE_BACKEND = import.meta.env.VITE_USE_NODE_BACKEND !== 'false';
const NODE_API_BASE_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api';

export const ApiService = {
  // Fetch Sessions Agenda
  async getSessions(track?: string): Promise<Session[]> {
    const trackParam = track && track !== 'All' ? `?track=${encodeURIComponent(track)}` : '';

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions${trackParam}`);
        if (res.ok) {
          const sessions = await res.json();
          return sessions.map((s: any) => ({
            ...s,
            rsvpCount: s.rsvpCount || 0,
          }));
        }
      } catch (err) {
        console.error('Node backend fetch failed for sessions:', err);
      }
    }

    try {
      let query = supabase.from('sessions').select('*').order('created_at', { ascending: true });
      if (track && track !== 'All') {
        query = query.eq('track', track);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map((s) => ({
          id: s.id,
          title: s.title,
          speaker: {
            name: s.speaker_name,
            role: s.speaker_role || '',
            avatar: s.speaker_avatar || '',
          },
          track: s.track,
          room: s.room,
          time: s.time,
          description: s.description || '',
          rsvpCount: 0,
        })) as Session[];
      }
    } catch (err) {
      console.error('Database query failed for sessions:', err);
    }
    return [];
  },

  // Fetch Booths List
  async getBooths(): Promise<Booth[]> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/booths`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('Node backend fetch failed for booths:', err);
      }
    }

    try {
      const { data, error } = await supabase.from('booths').select('*');
      if (!error && data) {
        return data.map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category,
          description: b.description || '',
          boothCode: b.booth_code,
          logoText: b.logo_text || '',
          logoUrl: b.logo_url || '',
          points: b.points || 15,
          location: b.location,
        })) as Booth[];
      }
    } catch (err) {
      console.error('Database query failed for booths:', err);
    }
    return [];
  },

  // Fetch FAQs
  async getFAQs(): Promise<FAQItem[]> {
    try {
      const { data, error } = await supabase.from('faqs').select('*');
      if (!error && data) return data as FAQItem[];
    } catch (err) {
      console.error('Database query failed for FAQs:', err);
    }
    return [];
  },

  // Fetch Rewards Catalog
  async getRewards(): Promise<RewardItem[]> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/gacha/rewards`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('Node backend fetch failed for rewards:', err);
      }
    }

    try {
      const { data, error } = await supabase.from('rewards').select('*');
      if (!error && data) {
        return data.map((r) => ({
          id: r.id,
          title: r.title,
          subtitle: r.subtitle || '',
          isUnlocked: r.required_stamps <= 1,
          isRedeemed: false,
          requiredStamps: r.required_stamps,
          currentStamps: 1,
        })) as RewardItem[];
      }
    } catch (err) {
      console.error('Database query failed for rewards:', err);
    }
    return [];
  },

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
            if (data.profile) return data.profile;
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
          };
        }
      } catch (err) {
        console.error('Database query failed for user profile by email:', err);
      }
    } else {
      // Fallback when no email is provided: try session token
      const sessionUser = await this.getCurrentUser();
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
          };
        }
      } catch (err) {
        console.error('Database query failed for user profile:', err);
      }
    }
    return null;
  },

  // Log In User with Email & Password
  async loginUser(email: string, password: string): Promise<{
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
    const status = await this.checkUserStatus(cleanEmail);
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
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('devfest_auth_token')
              ? { Authorization: `Bearer ${localStorage.getItem('devfest_auth_token')}` }
              : {}),
          },
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

  // Fetch Saved Session IDs for User
  async getSavedSessions(email: string): Promise<string[]> {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions/saved?email=${encodeURIComponent(cleanEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.savedSessionIds)) {
            localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(data.savedSessionIds));
            return data.savedSessionIds;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch saved sessions from Node backend:', err);
      }
    }

    try {
      const { data, error } = await supabase
        .from('user_saved_sessions')
        .select('session_id')
        .eq('user_email', cleanEmail);

      if (!error && data) {
        const ids = data.map((r) => r.session_id);
        localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(ids));
        return ids;
      }
    } catch (err) {
      console.warn('Supabase query failed for saved sessions:', err);
    }

    try {
      const cached = localStorage.getItem(`devfest_saved_sessions_${cleanEmail}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  // Toggle Save / RSVP Conference Session
  async toggleSaveSession(email: string, sessionId: string, status?: string): Promise<{ isSaved: boolean; isRsvpd: boolean; savedSessionIds: string[]; rsvpCount?: number }> {
    if (!email || !sessionId) return { isSaved: false, isRsvpd: false, savedSessionIds: [] };
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, sessionId, status }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.savedSessionIds)) {
            localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(data.savedSessionIds));
            return {
              isSaved: data.isSaved,
              isRsvpd: data.isRsvpd ?? data.isSaved,
              savedSessionIds: data.savedSessionIds,
              rsvpCount: data.rsvpCount,
            };
          }
        }
      } catch (err) {
        console.warn('Failed to toggle saved session on Node backend:', err);
      }
    }

    // Direct database fallback
    try {
      const { data: existing } = await supabase
        .from('user_saved_sessions')
        .select('id')
        .eq('user_email', cleanEmail)
        .eq('session_id', sessionId)
        .limit(1);

      let isSaved = false;
      if (existing && existing.length > 0) {
        await supabase
          .from('user_saved_sessions')
          .delete()
          .eq('user_email', cleanEmail)
          .eq('session_id', sessionId);
        isSaved = false;
      } else {
        await supabase
          .from('user_saved_sessions')
          .insert({ user_email: cleanEmail, session_id: sessionId, status: 'attending' });
        isSaved = true;
      }

      const { data: allSaved } = await supabase
        .from('user_saved_sessions')
        .select('session_id')
        .eq('user_email', cleanEmail)
        .neq('status', 'not_attending');

      const savedIds = allSaved ? allSaved.map((r) => r.session_id) : [];
      localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(savedIds));

      return { isSaved, isRsvpd: isSaved, savedSessionIds: savedIds };
    } catch (dbErr) {
      console.warn('Database RSVP toggle failed:', dbErr);
    }

    // LocalStorage fallback
    const current = await this.getSavedSessions(cleanEmail);
    const alreadySaved = current.includes(sessionId);
    const updated = alreadySaved ? current.filter((id) => id !== sessionId) : [...current, sessionId];
    localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(updated));

    return { isSaved: !alreadySaved, isRsvpd: !alreadySaved, savedSessionIds: updated };
  },

  // RSVP to a conference session (Semantic alias to toggleSaveSession)
  async rsvpSession(email: string, sessionId: string, status: 'attending' | 'not_attending' = 'attending') {
    return this.toggleSaveSession(email, sessionId, status);
  },

  // Get Attendees for a specific session
  async getSessionAttendees(sessionId: string): Promise<{ sessionId: string; attendees: any[]; totalAttendees: number }> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions/${sessionId}/attendees`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Failed to fetch session attendees from Node backend:', err);
      }
    }
    return { sessionId, attendees: [], totalAttendees: 0 };
  },

  // Submit Stamp Claim
  async claimBoothStamp(boothId: string, currentStamps: string[]): Promise<{ success: boolean; stamps: string[]; message: string }> {
    if (currentStamps.includes(boothId)) {
      return { success: false, stamps: currentStamps, message: 'Stamp already claimed!' };
    }

    const updatedStamps = [...currentStamps, boothId];

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/booths/stamp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boothId, currentStamps }),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('Node backend stamp claim failed:', err);
      }
    }

    try {
      await supabase.from('user_stamps').insert({ booth_id: boothId, claimed_at: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to sync stamp to database:', err);
    }

    return { success: true, stamps: updatedStamps, message: 'Stamp Claimed! +15 Pts' };
  },

  // Redeem Reward
  async redeemReward(rewardId: string): Promise<{ success: boolean; message: string }> {
    try {
      await supabase.from('user_redemptions').insert({ reward_id: rewardId, redeemed_at: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to sync redemption to database:', err);
    }
    return { success: true, message: 'Reward redeemed successfully!' };
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
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Node backend check-status failed, falling back to direct Supabase:', err);
      }
    }

    // 1. Check whitelist in database
    let isWhitelisted = false;
    let ticketType = 'Standard Attendee';

    try {
      const { data: whitelistData, error: wlError } = await supabase
        .rpc('validate_registration_email', { user_email: cleanEmail });

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

  // Atomic Blind Box Gacha Draw
  async drawBlindBoxReward(userId: string, requiredStamps = 5): Promise<{
    success: boolean;
    rewardId?: string;
    title?: string;
    subtitle?: string;
    rarity?: string;
    remainingQuantity?: number;
    message: string;
  }> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/gacha/draw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, requiredStamps }),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('Node backend gacha draw failed:', err);
      }
    }

    try {
      const { data, error } = await supabase.rpc('draw_blind_box_reward', {
        p_user_id: userId,
        p_required_stamps: requiredStamps,
      });

      if (!error && data && data.length > 0) {
        const result = data[0];
        return {
          success: result.success,
          rewardId: result.reward_id,
          title: result.title,
          subtitle: result.subtitle,
          rarity: result.rarity,
          remainingQuantity: result.remaining_quantity,
          message: result.message,
        };
      }
    } catch (err) {
      console.error('Blind box draw failed on database:', err);
    }

    return {
      success: false,
      message: 'Unable to process blind box draw. Please try again later.',
    };
  },

  // ===========================================================================
  // NOTIFICATIONS SYSTEM
  // ===========================================================================

  // Fetch all notifications with user read status and unread count
  async getNotifications(email?: string): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    const cleanEmail = email?.trim().toLowerCase();
    const emailParam = cleanEmail ? `?email=${encodeURIComponent(cleanEmail)}` : '';

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/notifications${emailParam}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Failed to fetch notifications from Node backend:', err);
      }
    }

    // Direct database fallback
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        let readSet = new Set<string>();

        if (cleanEmail) {
          const { data: reads } = await supabase
            .from('user_notification_reads')
            .select('notification_id')
            .eq('user_email', cleanEmail);

          if (reads) {
            reads.forEach((r: any) => readSet.add(r.notification_id));
          }
        }

        const formatted: AppNotification[] = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'organizer_announcement',
          targetTrack: n.target_track || 'All',
          scheduledAt: n.scheduled_at || n.created_at,
          createdAt: n.created_at,
          isRead: cleanEmail ? readSet.has(n.id) : false,
        }));

        const unreadCount = cleanEmail ? formatted.filter((n) => !n.isRead).length : 0;
        return { notifications: formatted, unreadCount };
      }
    } catch (err) {
      console.error('Database query failed for notifications:', err);
    }

    return { notifications: [], unreadCount: 0 };
  },

  // Mark single notification as read
  async markNotificationRead(email: string, notificationId: string): Promise<boolean> {
    if (!email || !notificationId) return false;
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/notifications/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, notificationId }),
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Failed to mark notification read via Node backend:', err);
      }
    }

    try {
      await supabase
        .from('user_notification_reads')
        .upsert({
          user_email: cleanEmail,
          notification_id: notificationId,
          read_at: new Date().toISOString(),
        }, { onConflict: 'user_email,notification_id' });
      return true;
    } catch (err) {
      console.warn('Database mark read failed:', err);
    }
    return false;
  },

  // Mark all notifications as read for user
  async markAllNotificationsRead(email: string): Promise<boolean> {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/notifications/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, markAll: true }),
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Failed to mark all notifications read via Node backend:', err);
      }
    }

    try {
      const { data: allNotifs } = await supabase.from('notifications').select('id');
      if (allNotifs && allNotifs.length > 0) {
        const rows = allNotifs.map((n: any) => ({
          user_email: cleanEmail,
          notification_id: n.id,
          read_at: new Date().toISOString(),
        }));
        await supabase
          .from('user_notification_reads')
          .upsert(rows, { onConflict: 'user_email,notification_id' });
        return true;
      }
    } catch (err) {
      console.warn('Database mark all read failed:', err);
    }
    return false;
  },

  // Broadcast announcement / notification
  async broadcastNotification(payload: { title: string; message: string; type?: string; targetTrack?: string }): Promise<AppNotification | null> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          return data.notification;
        }
      } catch (err) {
        console.warn('Failed to broadcast notification via Node backend:', err);
      }
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: payload.title,
          message: payload.message,
          type: payload.type || 'organizer_announcement',
          target_track: payload.targetTrack || 'All',
        })
        .select();

      if (!error && data) {
        return data[0] as AppNotification;
      }
    } catch (err) {
      console.error('Database notification insert failed:', err);
    }
    return null;
  },
};
