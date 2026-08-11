import { supabase } from '../lib/supabase';
import {
  MOCK_BOOTHS,
  MOCK_SESSIONS,
  MOCK_FAQS,
  MOCK_REWARDS,
  MOCK_USER_PROFILE,
} from '../data/mockData';
import type { RewardItem } from '../data/mockData';
import type { Booth, Session, FAQItem } from '../lib/types';

const USE_REMOTE_BACKEND = import.meta.env.VITE_USE_REMOTE_BACKEND === 'true';

export const ApiService = {
  // Fetch Sessions
  async getSessions(): Promise<Session[]> {
    if (USE_REMOTE_BACKEND) {
      try {
        const { data, error } = await supabase.from('sessions').select('*');
        if (!error && data && data.length > 0) return data as Session[];
      } catch (err) {
        console.warn('Backend fetch failed for sessions, falling back to mock data:', err);
      }
    }
    return MOCK_SESSIONS;
  },

  // Fetch Booths
  async getBooths(): Promise<Booth[]> {
    if (USE_REMOTE_BACKEND) {
      try {
        const { data, error } = await supabase.from('booths').select('*');
        if (!error && data && data.length > 0) return data as Booth[];
      } catch (err) {
        console.warn('Backend fetch failed for booths, falling back to mock data:', err);
      }
    }
    return MOCK_BOOTHS;
  },

  // Fetch FAQs
  async getFAQs(): Promise<FAQItem[]> {
    if (USE_REMOTE_BACKEND) {
      try {
        const { data, error } = await supabase.from('faqs').select('*');
        if (!error && data && data.length > 0) return data as FAQItem[];
      } catch (err) {
        console.warn('Backend fetch failed for FAQs, falling back to mock data:', err);
      }
    }
    return MOCK_FAQS;
  },

  // Fetch Rewards
  async getRewards(): Promise<RewardItem[]> {
    if (USE_REMOTE_BACKEND) {
      try {
        const { data, error } = await supabase.from('rewards').select('*');
        if (!error && data && data.length > 0) return data as RewardItem[];
      } catch (err) {
        console.warn('Backend fetch failed for rewards, falling back to mock data:', err);
      }
    }
    return MOCK_REWARDS;
  },

  // Fetch User Profile
  async getUserProfile() {
    if (USE_REMOTE_BACKEND) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Backend fetch failed for user profile, falling back to mock data:', err);
      }
    }
    return MOCK_USER_PROFILE;
  },

  // Submit Stamp Claim
  async claimBoothStamp(boothId: string, currentStamps: string[]): Promise<{ success: boolean; stamps: string[]; message: string }> {
    if (currentStamps.includes(boothId)) {
      return { success: false, stamps: currentStamps, message: 'Stamp already claimed!' };
    }

    const updatedStamps = [...currentStamps, boothId];

    if (USE_REMOTE_BACKEND) {
      try {
        await supabase.from('user_stamps').insert({ booth_id: boothId, claimed_at: new Date().toISOString() });
      } catch (err) {
        console.warn('Failed to sync stamp to backend:', err);
      }
    }

    return { success: true, stamps: updatedStamps, message: 'Stamp Claimed! +15 Pts' };
  },

  // Redeem Reward
  async redeemReward(rewardId: string): Promise<{ success: boolean; message: string }> {
    if (USE_REMOTE_BACKEND) {
      try {
        await supabase.from('user_redemptions').insert({ reward_id: rewardId, redeemed_at: new Date().toISOString() });
      } catch (err) {
        console.warn('Failed to sync redemption to backend:', err);
      }
    }
    return { success: true, message: 'Reward redeemed successfully!' };
  },
};
