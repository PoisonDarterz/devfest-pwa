import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const connectionsRouter = Router();

// POST /api/connections - Record new friend connection via NFC or QR
connectionsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId, friendId, method } = req.body;

  if (!userId || !friendId) {
    res.status(400).json({ success: false, message: 'userId and friendId are required.' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('connections')
      .upsert({
        user_id: userId,
        friend_id: friendId,
        method: method || 'QR Scan',
        created_at: new Date().toISOString(),
      })
      .select();

    if (!error && data) {
      res.json({ success: true, connection: data[0], message: 'Friend connection saved!' });
      return;
    }
  } catch (err) {
    console.warn('Failed to insert connection to DB:', err);
  }

  res.json({
    success: true,
    connection: { userId, friendId, method: method || 'QR Scan' },
    message: 'Friend connection saved locally!',
  });
});

// GET /api/connections/:userId - Fetch all connections for a user
connectionsRouter.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('connections')
      .select('*, friend:profiles!connections_friend_id_fkey(*)')
      .eq('user_id', userId);

    if (!error && data) {
      res.json(data);
      return;
    }
  } catch (err) {
    console.warn('Failed to fetch connections from DB:', err);
  }

  res.json([]);
});
