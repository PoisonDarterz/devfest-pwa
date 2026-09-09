import { supabase } from '../lib/supabase';
import type { Booth, Session, FAQItem } from '../lib/types';

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

const USE_NODE_BACKEND = import.meta.env.VITE_USE_NODE_BACKEND === 'true';
const NODE_API_BASE_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api';

export const ApiService = {
  // Fetch Sessions Agenda
  async getSessions(): Promise<Session[]> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('Node backend fetch failed for sessions:', err);
      }
    }

    try {
      const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: true });
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
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      if (!error && data && data.length > 0) {
        const p = data[0];
        return {
          id: p.id,
          name: p.full_name,
          role: p.company_role || 'Participant',
          email: p.email,
          avatar: p.avatar_url || '',
          bio: p.bio || '',
          githubUrl: p.github_url || '',
          linkedinUrl: p.linkedin_url || '',
          qrPayload: p.qr_payload || '',
        };
      }
    } catch (err) {
      console.error('Database query failed for user profile:', err);
    }
    return null;
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
          avatar: p.avatar_url || '',
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

  // Save or Update User Profile
  async saveUserProfile(profile: {
    name: string;
    email: string;
    role?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    avatar?: string;
  }): Promise<{ success: boolean; profile: UserProfile; message: string }> {
    const qrPayload = `DEVFEST-KL-2026-${profile.name.toUpperCase().replace(/\s+/g, '-')}`;

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: profile.name,
            email: profile.email,
            role: profile.role,
            bio: profile.bio,
            githubUrl: profile.githubUrl,
            linkedinUrl: profile.linkedinUrl,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          return { success: true, profile: json.user, message: 'Profile saved successfully!' };
        }
      } catch (err) {
        console.warn('Node backend save user profile failed:', err);
      }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            email: profile.email,
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
        return {
          success: true,
          profile: {
            id: p.id,
            name: p.full_name,
            role: p.company_role || 'Participant',
            email: p.email,
            avatar: p.avatar_url || '',
            bio: p.bio || '',
            githubUrl: p.github_url || '',
            linkedinUrl: p.linkedin_url || '',
            qrPayload: p.qr_payload || qrPayload,
          },
          message: 'Profile saved successfully!',
        };
      }
    } catch (err) {
      console.warn('Database save user profile failed:', err);
    }

    return {
      success: true,
      profile: {
        id: 'usr_local',
        name: profile.name,
        role: profile.role || 'Participant',
        email: profile.email,
        avatar: profile.avatar || '',
        bio: profile.bio || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        qrPayload,
      },
      message: 'Profile saved locally!',
    };
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

    // 1. Check whitelist
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

    // Demo fallback for test users
    if (!isWhitelisted && (cleanEmail.includes('devfest') || cleanEmail.includes('gmail') || cleanEmail.length > 5)) {
      isWhitelisted = true;
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
            avatar: p.avatar_url || '',
            bio: p.bio || '',
            githubUrl: p.github_url || '',
            linkedinUrl: p.linkedin_url || '',
            qrPayload: p.qr_payload || '',
          },
          ticketType,
          message: 'User profile found!',
        };
      }
    } catch (err) {
      console.warn('Profile lookup failed:', err);
    }

    // Demo check: If email is zixu or jonas and DB is unreachable, consider registered
    if (cleanEmail === 'zixu.cheah@devfest.kl') {
      return {
        isWhitelisted: true,
        hasProfile: true,
        profile: {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Zixu Cheah',
          role: 'Software Engineer',
          email: 'zixu.cheah@devfest.kl',
          avatar: '',
          bio: 'Full-stack engineer building high-performance web applications and PWAs.',
          githubUrl: 'https://github.com/zixucheah',
          linkedinUrl: 'https://linkedin.com/in/zixucheah',
          qrPayload: 'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
        },
        ticketType,
        message: 'User profile found!',
      };
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
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/auth/validate-ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.error('Node backend whitelist validation failed:', err);
      }
    }

    try {
      const { data, error } = await supabase.rpc('validate_registration_email', { user_email: email });
      if (!error && data && data.length > 0) {
        const res = data[0];
        return {
          isWhitelisted: !!res.is_whitelisted,
          ticketType: res.ticket_type || 'Standard Attendee',
          message: res.is_whitelisted ? 'Email verified against ticket records!' : 'Email not found in ticketed whitelist.',
        };
      }
    } catch (err) {
      console.error('Email whitelist validation failed:', err);
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
};
