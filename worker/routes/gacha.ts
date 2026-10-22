import { Hono } from 'hono';
import { getSupabaseAdmin } from '../db';
import { getNextRewardClaimCode } from './auth';
import type { Env } from '../types';

export const gachaRouter = new Hono<{ Bindings: Env }>();

// GET /api/gacha/rewards - List active rewards and swag items
gachaRouter.get('/rewards', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  try {
    const { data, error } = await supabaseAdmin.from('rewards').select('*');

    if (!error && data && data.length > 0) {
      const formatted = data.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle || '',
        isUnlocked: r.required_stamps <= 1,
        isRedeemed: false,
        requiredStamps: r.required_stamps,
        currentStamps: 1,
      }));
      return c.json(formatted);
    }
  } catch (err) {
    console.warn('Failed to fetch rewards from DB:', err);
  }

  return c.json([
    {
      id: 'gemini-1',
      title: '7 days Free Gemini Pro',
      subtitle: 'Valid until 31/12/2026.',
      isUnlocked: true,
      isRedeemed: false,
      requiredStamps: 1,
      currentStamps: 1,
    },
    {
      id: 'blindbox-1',
      title: 'GDGKL Blind Box',
      subtitle: 'Collect 5 stamps to unlock.',
      isUnlocked: false,
      isRedeemed: false,
      requiredStamps: 5,
      currentStamps: 2,
    },
  ]);
});

const isValidUuid = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
};

// POST /api/gacha/draw - Invoke atomic blind box draw procedure
gachaRouter.post('/draw', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { userId, requiredStamps = 5 } = body;

  if (userId && isValidUuid(userId)) {
    try {
      const { data: prof } = await supabaseAdmin
        .from('vw_profiles')
        .select('ticket_type')
        .eq('id', userId)
        .maybeSingle();

      if (prof?.ticket_type && prof.ticket_type.toLowerCase().includes('walk-in')) {
        return c.json(
          {
            success: false,
            message:
              'Rewards and mystery boxes are exclusive to registered attendees. Walk-in passes do not include reward access.',
          },
          403
        );
      }

      const { data, error } = await supabaseAdmin.rpc('draw_blind_box_reward', {
        p_user_id: userId,
        p_required_stamps: requiredStamps,
      });

      if (!error && data && data.length > 0) {
        const result = data[0];
        return c.json({
          success: result.success,
          rewardId: result.reward_id,
          title: result.title,
          subtitle: result.subtitle,
          rarity: result.rarity,
          remainingQuantity: result.remaining_quantity,
          message: result.message,
        });
      }
    } catch (err) {
      console.warn('Blind box draw failed on DB RPC:', err);
    }
  }

  return c.json({
    success: true,
    rewardId: 'gemini-1',
    title: '7 days Free Gemini Pro',
    subtitle: 'Valid until 31/12/2026.',
    rarity: 'Rare',
    remainingQuantity: 42,
    message: 'Congratulations! You won: 7 days Free Gemini Pro',
  });
});

// GET /api/gacha/user-rewards - Fetch rewards for current participant
gachaRouter.get('/user-rewards', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const email = c.req.query('email');
  const userId = c.req.query('userId');

  try {
    let targetUserId: string | null = null;

    if (userId && isValidUuid(userId)) {
      targetUserId = userId.trim();
    }

    if (!targetUserId && email) {
      const cleanEmail = email.trim().toLowerCase();
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (prof?.id && isValidUuid(prof.id)) {
        targetUserId = prof.id;
      }
    }

    if (!targetUserId) {
      return c.json({ success: true, rewards: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user_rewards:', error);
      return c.json({ success: false, message: error.message }, 500);
    }

    const formatted = (data || []).map((r) => ({
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

    return c.json({ success: true, rewards: formatted });
  } catch (err: any) {
    console.error('Server error fetching user rewards:', err);
    return c.json({ success: false, message: err?.message || 'Server error' }, 500);
  }
});

// POST /api/gacha/claim-reward - Staff marks a participant's reward as claimed/received
gachaRouter.post('/claim-reward', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { userRewardId } = body;

  if (!userRewardId) {
    return c.json({ success: false, message: 'Reward ID is required.' }, 400);
  }

  try {
    const { data: currentReward, error: fetchErr } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('id', userRewardId)
      .maybeSingle();

    if (fetchErr || !currentReward) {
      return c.json({ success: false, message: 'Reward not found.' }, 404);
    }

    if (currentReward.status === 'claimed') {
      return c.json({
        success: true,
        alreadyClaimed: true,
        message: 'This reward has already been marked as received.',
        reward: {
          id: currentReward.id,
          userId: currentReward.user_id,
          rewardId: currentReward.reward_id,
          rewardType: currentReward.reward_type,
          title: currentReward.title,
          subtitle: currentReward.subtitle || '',
          description: currentReward.description || '',
          claimCode: currentReward.claim_code,
          status: currentReward.status,
          claimedAt: currentReward.claimed_at,
          createdAt: currentReward.created_at,
        },
      });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('user_rewards')
      .update({
        status: 'claimed',
        claimed_at: now,
      })
      .eq('id', userRewardId)
      .select()
      .maybeSingle();

    if (updateErr || !updated) {
      return c.json({ success: false, message: updateErr?.message || 'Failed to update reward status.' }, 500);
    }

    try {
      await supabaseAdmin.from('user_redemptions').insert({
        user_id: updated.user_id,
        reward_id: updated.reward_id || null,
        redeemed_at: now,
      });
    } catch (auditErr) {
      console.warn('Non-fatal error logging redemption audit:', auditErr);
    }

    return c.json({
      success: true,
      message: 'Reward marked as claimed successfully!',
      reward: {
        id: updated.id,
        userId: updated.user_id,
        rewardId: updated.reward_id,
        rewardType: updated.reward_type,
        title: updated.title,
        subtitle: updated.subtitle || '',
        description: updated.description || '',
        claimCode: updated.claim_code,
        status: updated.status,
        claimedAt: updated.claimed_at,
        createdAt: updated.created_at,
      },
    });
  } catch (err: any) {
    console.error('Server error claiming reward:', err);
    return c.json({ success: false, message: err?.message || 'Server error claiming reward.' }, 500);
  }
});

// POST /api/gacha/unlock-box - Unlocks physical blind box reward for a participant
gachaRouter.post('/unlock-box', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { userId, email, selectedBoxIndex = 0 } = body;

  try {
    let targetUserId: string | null = null;
    if (userId && typeof userId === 'string' && isValidUuid(userId)) {
      targetUserId = userId.trim();
    }

    if (!targetUserId && email && typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase();
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (prof?.id && isValidUuid(prof.id)) {
        targetUserId = prof.id;
      }
    }

    if (!targetUserId) {
      return c.json({
        success: true,
        reward: {
          id: `local-box-${Date.now()}`,
          userId: 'local-user',
          rewardType: 'blind_box',
          title: 'DevFest 2026 Mystery Blind Box',
          subtitle: `Official attendee blind box collectible (Box #${(selectedBoxIndex ?? 0) + 1} chosen).`,
          description:
            'All 9 boxes grant the official DevFest KL 2026 Mystery Blind Box. Show this code to the Rewards Counter staff to receive your gift.',
          claimCode: 'DF26-BOX-0001',
          status: 'unclaimed',
          createdAt: new Date().toISOString(),
        },
      });
    }

    const { data: prof } = await supabaseAdmin
      .from('vw_profiles')
      .select('ticket_type')
      .eq('id', targetUserId)
      .maybeSingle();

    if (prof?.ticket_type && prof.ticket_type.toLowerCase().includes('walk-in')) {
      return c.json(
        {
          success: false,
          message:
            'Rewards and mystery boxes are exclusive to registered attendees. Walk-in passes do not include reward access.',
        },
        403
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('reward_type', 'blind_box')
      .maybeSingle();

    if (existing) {
      return c.json({
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
      });
    }

    const claimCode = await getNextRewardClaimCode(supabaseAdmin, 'DF26-BOX');
    const boxNum = (selectedBoxIndex ?? 0) + 1;

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('user_rewards')
      .insert({
        user_id: targetUserId,
        reward_type: 'blind_box',
        title: 'DevFest 2026 Mystery Blind Box',
        subtitle: `Official attendee blind box collectible (Box #${boxNum} chosen).`,
        description:
          'All 9 boxes grant the official DevFest KL 2026 Mystery Blind Box. Show this code to the Rewards Counter staff to receive your gift.',
        claim_code: claimCode,
        status: 'unclaimed',
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      return c.json({ success: false, message: insertErr?.message || 'Failed to create blind box reward' }, 500);
    }

    return c.json({
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
    });
  } catch (err: any) {
    console.error('Error unlocking blind box:', err);
    return c.json({ success: false, message: err?.message || 'Server error unlocking blind box' }, 500);
  }
});
