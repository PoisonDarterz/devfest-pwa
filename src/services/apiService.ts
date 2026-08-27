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
