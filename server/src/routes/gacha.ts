import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const gachaRouter = Router();

// GET /api/gacha/rewards - List active rewards and swag items
gachaRouter.get('/rewards', async (_req: Request, res: Response): Promise<void> => {
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
      res.json(formatted);
      return;
    }
  } catch (err) {
    console.warn('Failed to fetch rewards from DB:', err);
  }

  res.json([
    { id: 'gemini-1', title: '7 days Free Gemini Pro', subtitle: 'Valid until 31/12/2026.', isUnlocked: true, isRedeemed: false, requiredStamps: 1, currentStamps: 1 },
    { id: 'blindbox-1', title: 'GDGKL Blind Box', subtitle: 'Collect 5 stamps to unlock.', isUnlocked: false, isRedeemed: false, requiredStamps: 5, currentStamps: 2 },
  ]);
});

// POST /api/gacha/draw - Invoke atomic blind box draw procedure
gachaRouter.post('/draw', async (req: Request, res: Response): Promise<void> => {
  const { userId, requiredStamps = 5 } = req.body;

  if (userId) {
    try {
      const { data, error } = await supabaseAdmin.rpc('draw_blind_box_reward', {
        p_user_id: userId,
        p_required_stamps: requiredStamps,
      });

      if (!error && data && data.length > 0) {
        const result = data[0];
        res.json({
          success: result.success,
          rewardId: result.reward_id,
          title: result.title,
          subtitle: result.subtitle,
          rarity: result.rarity,
          remainingQuantity: result.remaining_quantity,
          message: result.message,
        });
        return;
      }
    } catch (err) {
      console.warn('Blind box draw failed on DB RPC:', err);
    }
  }

  // Fallback draw
  res.json({
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
gachaRouter.get('/user-rewards', async (req: Request, res: Response): Promise<void> => {
  const { email, userId } = req.query;

  try {
    let targetUserId = userId as string | undefined;

    if (!targetUserId && email && typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase();
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (prof?.id) {
        targetUserId = prof.id;
      }
    }

    if (!targetUserId) {
      res.json({ success: true, rewards: [] });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user_rewards:', error);
      res.status(500).json({ success: false, message: error.message });
      return;
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

    res.json({ success: true, rewards: formatted });
  } catch (err: any) {
    console.error('Server error fetching user rewards:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
});

// POST /api/gacha/claim-reward - Staff marks a participant's reward as claimed/received
gachaRouter.post('/claim-reward', async (req: Request, res: Response): Promise<void> => {
  const { userRewardId } = req.body;

  if (!userRewardId) {
    res.status(400).json({ success: false, message: 'Reward ID is required.' });
    return;
  }

  try {
    // 1. Fetch current status of reward
    const { data: currentReward, error: fetchErr } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('id', userRewardId)
      .maybeSingle();

    if (fetchErr || !currentReward) {
      res.status(404).json({ success: false, message: 'Reward not found.' });
      return;
    }

    if (currentReward.status === 'claimed') {
      res.json({
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
      return;
    }

    // 2. Mark as claimed
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
      res.status(500).json({ success: false, message: updateErr?.message || 'Failed to update reward status.' });
      return;
    }

    // 3. Log to user_redemptions audit log
    try {
      await supabaseAdmin.from('user_redemptions').insert({
        user_id: updated.user_id,
        reward_id: updated.reward_id || null,
        redeemed_at: now,
      });
    } catch (auditErr) {
      console.warn('Non-fatal error logging redemption audit:', auditErr);
    }

    res.json({
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
    res.status(500).json({ success: false, message: err?.message || 'Server error claiming reward.' });
  }
});
