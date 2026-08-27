import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const boothsRouter = Router();

// GET /api/booths - Fetch all partner and sponsor booths
boothsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('booths').select('*');

    if (!error && data && data.length > 0) {
      const formatted = data.map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        description: b.description || '',
        boothCode: b.booth_code,
        logoText: b.logo_text || '',
        logoUrl: b.logo_url || '',
        points: b.points || 15,
        location: b.location,
      }));
      res.json(formatted);
      return;
    }
  } catch (err) {
    console.warn('Failed to fetch booths from DB:', err);
  }

  // Fallback booths
  res.json([
    { id: 'b1', name: '42KL', category: 'Community', logoText: '42 KL | Sunway Education Group', location: 'Hall A - #01', description: 'Peer-to-peer coding school in Sunway Education Group.', boothCode: 'BOOTH-42KL', points: 15 },
    { id: 'b2', name: 'Google Cloud Malaysia', category: 'Platinum Sponsor', logoText: 'Google Cloud', location: 'Hall A - #02', description: 'Enterprise cloud infrastructure, Kubernetes & BigQuery solutions.', boothCode: 'BOOTH-GCP', points: 15 },
  ]);
});

// POST /api/booths/stamp - Claim booth passport stamp
boothsRouter.post('/stamp', async (req: Request, res: Response): Promise<void> => {
  const { boothId, userId, currentStamps } = req.body;

  if (currentStamps && Array.isArray(currentStamps) && currentStamps.includes(boothId)) {
    res.json({ success: false, stamps: currentStamps, message: 'Stamp already claimed!' });
    return;
  }

  const updatedStamps = [...(currentStamps || []), boothId];

  if (userId) {
    try {
      await supabaseAdmin.from('user_stamps').insert({ user_id: userId, booth_id: boothId, claimed_at: new Date().toISOString() });
    } catch (err) {
      console.warn('Failed to insert user stamp into DB:', err);
    }
  }

  res.json({ success: true, stamps: updatedStamps, message: 'Stamp Claimed! +15 Pts' });
});
