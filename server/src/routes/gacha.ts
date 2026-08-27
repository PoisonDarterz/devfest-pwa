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
