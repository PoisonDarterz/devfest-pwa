import { supabase } from '../lib/supabase';
import type { Booth } from '../lib/types';
import { USE_NODE_BACKEND, NODE_API_BASE_URL, getAuthHeaders } from './apiConfig';
import type { RewardItem } from './apiConfig';

export interface UserRewardItem {
  id: string;
  userId: string;
  rewardId?: string;
  rewardType: 'entry_swag' | 'blind_box' | 'custom' | string;
  title: string;
  subtitle?: string;
  description?: string;
  claimCode: string;
  status: 'unclaimed' | 'claimed';
  claimedAt?: string;
  createdAt?: string;
}

export interface UserStampsResponse {
  success: boolean;
  stamps: string[];
  stampDetails?: Array<{
    id: string;
    boothId: string;
    boothName: string;
    boothCode: string;
    category: string;
    location: string;
    claimedAt: string;
    points: number;
  }>;
  totalStamps: number;
  totalPoints: number;
}

export interface ClaimStampResult {
  success: boolean;
  alreadyClaimed?: boolean;
  booth?: Booth;
  stamps: string[];
  totalStamps?: number;
  message: string;
}

export const rewardsService = {
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

  // Fetch Claimed Stamps for Current User
  async getUserStamps(email?: string): Promise<UserStampsResponse> {
    const cleanEmail = email?.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const url = cleanEmail
          ? `${NODE_API_BASE_URL}/booths/stamps?email=${encodeURIComponent(cleanEmail)}`
          : `${NODE_API_BASE_URL}/booths/stamps`;

        const res = await fetch(url, {
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            stamps: Array.isArray(data.stamps) ? data.stamps : [],
            stampDetails: data.stampDetails || [],
            totalStamps: data.totalStamps || (Array.isArray(data.stamps) ? data.stamps.length : 0),
            totalPoints: data.totalPoints || 0,
          };
        }
      } catch (err) {
        console.error('Node backend fetch failed for user stamps:', err);
      }
    }

    // Direct Supabase Fallback
    try {
      if (cleanEmail) {
        const { data: user } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (user?.id) {
          const { data, error } = await supabase
            .from('user_stamps')
            .select('id, booth_id, claimed_at, booth:booths(*)')
            .eq('user_id', user.id)
            .order('claimed_at', { ascending: true });

          if (!error && data) {
            const stampDetails = data.map((row: any) => ({
              id: row.id,
              boothId: row.booth_id,
              boothName: row.booth?.name || 'Partner Booth',
              boothCode: row.booth?.booth_code || '',
              category: row.booth?.category || '',
              location: row.booth?.location || '',
              claimedAt: row.claimed_at,
              points: row.booth?.points || 15,
            }));
            const stamps = stampDetails.map((s: any) => s.boothId);
            return {
              success: true,
              stamps,
              stampDetails,
              totalStamps: stamps.length,
              totalPoints: stampDetails.reduce((sum: number, s: any) => sum + s.points, 0),
            };
          }
        }
      }
    } catch (err) {
      console.error('Supabase query failed for user stamps:', err);
    }

    return {
      success: true,
      stamps: [],
      stampDetails: [],
      totalStamps: 0,
      totalPoints: 0,
    };
  },

  // Fetch Rewards Catalog
  async getRewards(currentStampsCount = 0): Promise<RewardItem[]> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/gacha/rewards`);
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw)) {
            return raw.map((r: any) => ({
              id: r.id,
              title: r.title,
              subtitle: r.subtitle || '',
              isUnlocked: currentStampsCount >= (r.requiredStamps || r.required_stamps || 1),
              isRedeemed: !!r.isRedeemed,
              requiredStamps: r.requiredStamps || r.required_stamps || 1,
              currentStamps: currentStampsCount,
            }));
          }
        }
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
          isUnlocked: currentStampsCount >= r.required_stamps,
          isRedeemed: false,
          requiredStamps: r.required_stamps,
          currentStamps: currentStampsCount,
        })) as RewardItem[];
      }
    } catch (err) {
      console.error('Database query failed for rewards:', err);
    }
    return [];
  },

  // Submit Stamp Claim via QR Scan or Booth ID
  async claimBoothStamp(
    boothIdentifier: string,
    userEmail?: string,
    currentStamps: string[] = []
  ): Promise<ClaimStampResult> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/booths/stamp`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            qrPayload: boothIdentifier,
            email: userEmail,
            currentStamps,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            success: data.success,
            alreadyClaimed: data.alreadyClaimed,
            booth: data.booth,
            stamps: Array.isArray(data.stamps) ? data.stamps : currentStamps,
            totalStamps: data.totalStamps,
            message: data.message,
          };
        } else {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            stamps: currentStamps,
            message: errData.message || 'Failed to claim stamp.',
          };
        }
      } catch (err) {
        console.error('Node backend stamp claim failed:', err);
      }
    }

    // Direct Supabase Fallback
    try {
      // Find booth
      const { data: booth } = await supabase
        .from('booths')
        .select('*')
        .or(`id.eq.${boothIdentifier},booth_code.ilike.${boothIdentifier}`)
        .maybeSingle();

      if (!booth) {
        return {
          success: false,
          stamps: currentStamps,
          message: 'Invalid booth QR code.',
        };
      }

      if (currentStamps.includes(booth.id)) {
        return {
          success: false,
          alreadyClaimed: true,
          booth,
          stamps: currentStamps,
          message: `You've already collected the stamp for ${booth.name}!`,
        };
      }

      if (userEmail) {
        const { data: user } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', userEmail.trim().toLowerCase())
          .maybeSingle();

        if (user?.id) {
          await supabase.from('user_stamps').insert({
            user_id: user.id,
            booth_id: booth.id,
            claimed_at: new Date().toISOString(),
          });
        }
      }

      const updated = [...currentStamps, booth.id];
      return {
        success: true,
        alreadyClaimed: false,
        booth,
        stamps: updated,
        totalStamps: updated.length,
        message: `Stamp Claimed! Visited ${booth.name} (+${booth.points || 15} Pts)`,
      };
    } catch (err) {
      console.error('Failed to sync stamp to database:', err);
    }

    return {
      success: false,
      stamps: currentStamps,
      message: 'Failed to claim stamp.',
    };
  },

  // Redeem Reward
  async redeemReward(rewardId: string): Promise<{ success: boolean; message: string }> {
    try {
      await supabase.from('user_redemptions').insert({
        reward_id: rewardId,
        redeemed_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to sync redemption to database:', err);
    }
    return { success: true, message: 'Reward redeemed successfully!' };
  },

  // Atomic Blind Box Gacha Draw
  async drawBlindBoxReward(
    userId: string,
    requiredStamps = 5
  ): Promise<{
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
          headers: getAuthHeaders(),
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

  // Fetch Participant's Specific Rewards (Entry Swag, Blind Box, etc.)
  async getUserRewards(userEmail?: string, userId?: string): Promise<UserRewardItem[]> {
    const cleanEmail = userEmail?.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const params = new URLSearchParams();
        if (cleanEmail) params.append('email', cleanEmail);
        if (userId) params.append('userId', userId);

        const res = await fetch(`${NODE_API_BASE_URL}/gacha/user-rewards?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.rewards)) {
            return data.rewards;
          }
        }
      } catch (err) {
        console.warn('Node backend fetch failed for user rewards:', err);
      }
    }

    // Direct Supabase Fallback
    try {
      let targetUserId = userId;
      if (!targetUserId && cleanEmail) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', cleanEmail)
          .maybeSingle();
        targetUserId = prof?.id;
      }

      if (targetUserId) {
        const { data, error } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            rewardId: r.reward_id,
            rewardType: r.reward_type,
            title: r.title,
            subtitle: r.subtitle || '',
            description: r.description || '',
            claimCode: r.claim_code,
            status: r.status,
            claimedAt: r.claimed_at,
            createdAt: r.created_at,
          }));
        }
      }
    } catch (err) {
      console.warn('Direct Supabase fetch failed for user rewards:', err);
    }

    return [];
  },

  // Counter Staff Marks Participant's Reward as Claimed/Received
  async claimUserReward(
    userRewardId: string,
    userEmail?: string
  ): Promise<{ success: boolean; message: string; reward?: UserRewardItem }> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/gacha/claim-reward`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ userRewardId, email: userEmail }),
        });
        if (res.ok) {
          return await res.json();
        } else {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData.message || 'Failed to claim reward.' };
        }
      } catch (err: any) {
        console.warn('Node backend claim reward failed:', err);
      }
    }

    // Direct Supabase Fallback
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('user_rewards')
        .update({
          status: 'claimed',
          claimed_at: now,
        })
        .eq('id', userRewardId)
        .select()
        .maybeSingle();

      if (!error && data) {
        try {
          await supabase.from('user_redemptions').insert({
            user_id: data.user_id,
            reward_id: data.reward_id || null,
            redeemed_at: now,
          });
        } catch {}

        return {
          success: true,
          message: 'Reward claimed successfully!',
          reward: {
            id: data.id,
            userId: data.user_id,
            rewardId: data.reward_id,
            rewardType: data.reward_type,
            title: data.title,
            subtitle: data.subtitle || '',
            description: data.description || '',
            claimCode: data.claim_code,
            status: data.status,
            claimedAt: data.claimed_at,
            createdAt: data.created_at,
          },
        };
      }
    } catch (err: any) {
      console.error('Direct Supabase claim reward failed:', err);
    }

    return { success: false, message: 'Failed to update reward status.' };
  },
};
