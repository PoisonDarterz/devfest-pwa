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
          .from('vw_profiles')
          .select('id, ticket_type')
          .ilike('email', userEmail.trim().toLowerCase())
          .maybeSingle();

        if (user?.ticket_type && user.ticket_type.toLowerCase().includes('walk-in')) {
          return {
            success: false,
            stamps: currentStamps,
            message: 'Passport stamps and rewards are exclusive to registered attendees. Walk-in passes do not include stamp access.',
          };
        }

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

    const isUuid = !!userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId.trim());

    if (isUuid) {
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
      let targetUserId: string | null = null;
      if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId.trim())) {
        targetUserId = userId.trim();
      }

      if (!targetUserId && cleanEmail) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', cleanEmail)
          .maybeSingle();
        if (prof?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prof.id)) {
          targetUserId = prof.id;
        }
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

  // Unlock Physical Blind Box Reward for a participant (all 9 choices grant the same physical box)
  async unlockBlindBoxReward(
    userId?: string,
    userEmail?: string,
    selectedBoxIndex = 0
  ): Promise<{ success: boolean; reward?: UserRewardItem; message?: string }> {
    const cleanEmail = userEmail?.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/gacha/unlock-box`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ userId, email: cleanEmail, selectedBoxIndex }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.reward) {
            return { success: true, reward: json.reward };
          }
        }
      } catch (err) {
        console.warn('Node backend unlock-box failed, falling back to direct DB:', err);
      }
    }

    // Direct Supabase Fallback
    try {
      let targetUserId: string | null = null;
      if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId.trim())) {
        targetUserId = userId.trim();
      }

      if (!targetUserId && cleanEmail) {
        const { data: prof } = await supabase
          .from('vw_profiles')
          .select('id, ticket_type')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (prof?.ticket_type && prof.ticket_type.toLowerCase().includes('walk-in')) {
          return {
            success: false,
            message: 'Rewards and mystery boxes are exclusive to registered attendees. Walk-in passes do not include reward access.',
          };
        }

        if (prof?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prof.id)) {
          targetUserId = prof.id;
        }
      }

      if (!targetUserId) {
        return {
          success: true,
          reward: {
            id: `local-box-${Date.now()}`,
            userId: 'local-user',
            rewardType: 'blind_box',
            title: 'DevFest 2026 Mystery Blind Box',
            subtitle: `Official attendee blind box collectible (Box #${selectedBoxIndex + 1} chosen).`,
            description: 'All 9 boxes grant the official DevFest KL 2026 Mystery Blind Box. Show this code to the Rewards Counter staff to receive your gift.',
            claimCode: `DF26-BOX-0001`,
            status: 'unclaimed',
          },
        };
      }

      const { data: existing } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('reward_type', 'blind_box')
        .maybeSingle();

      if (existing) {
        return {
          success: true,
          reward: {
            id: existing.id,
            userId: existing.user_id,
            rewardType: existing.reward_type,
            title: existing.title,
            subtitle: existing.subtitle || '',
            description: existing.description || '',
            claimCode: existing.claim_code,
            status: existing.status,
            claimedAt: existing.claimed_at,
            createdAt: existing.created_at,
          },
        };
      }

      // Auto-increment next claim code
      const { data: allBoxes } = await supabase
        .from('user_rewards')
        .select('claim_code')
        .ilike('claim_code', 'DF26-BOX-%');

      const existingCodes = new Set<string>();
      let maxSequential = 0;
      if (allBoxes && allBoxes.length > 0) {
        for (const row of allBoxes) {
          const code = (row.claim_code || '').trim();
          existingCodes.add(code);
          const match = code.match(/-0*(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSequential) {
              maxSequential = num;
            }
          }
        }
      }

      let nextNum = maxSequential + 1;
      let claimCode = `DF26-BOX-${String(nextNum).padStart(4, '0')}`;
      while (existingCodes.has(claimCode)) {
        nextNum++;
        claimCode = `DF26-BOX-${String(nextNum).padStart(4, '0')}`;
      }

      const { data: inserted, error } = await supabase
        .from('user_rewards')
        .insert({
          user_id: targetUserId,
          reward_type: 'blind_box',
          title: 'DevFest 2026 Mystery Blind Box',
          subtitle: `Official attendee blind box collectible (Box #${selectedBoxIndex + 1} chosen).`,
          description: 'All 9 boxes grant the official DevFest KL 2026 Mystery Blind Box. Show this code to the Rewards Counter staff to receive your gift.',
          claim_code: claimCode,
          status: 'unclaimed',
        })
        .select()
        .maybeSingle();

      if (!error && inserted) {
        return {
          success: true,
          reward: {
            id: inserted.id,
            userId: inserted.user_id,
            rewardType: inserted.reward_type,
            title: inserted.title,
            subtitle: inserted.subtitle || '',
            description: inserted.description || '',
            claimCode: inserted.claim_code,
            status: inserted.status,
            claimedAt: inserted.claimed_at,
            createdAt: inserted.created_at,
          },
        };
      }
    } catch (err) {
      console.warn('Direct DB fallback failed for blind box unlock:', err);
    }

    return {
      success: true,
      reward: {
        id: `fallback-box-${Date.now()}`,
        userId: userId || 'fallback',
        rewardType: 'blind_box',
        title: 'DevFest 2026 Mystery Blind Box',
        subtitle: `Official attendee blind box collectible (Box #${selectedBoxIndex + 1} chosen).`,
        description: 'All 9 boxes grant the official DevFest KL 2026 Mystery Blind Box. Show this code to the Rewards Counter staff to receive your gift.',
        claimCode: 'DF26-BOX-0001',
        status: 'unclaimed',
      },
    };
  },
};
