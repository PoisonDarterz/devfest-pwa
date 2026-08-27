import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const sessionsRouter = Router();

// GET /api/sessions - List all conference sessions
sessionsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('sessions').select('*').order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const formatted = data.map((s) => ({
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
      }));
      res.json(formatted);
      return;
    }
  } catch (err) {
    console.warn('Failed to fetch sessions from DB, serving mock fallback:', err);
  }

  // Mock sessions fallback
  res.json([
    {
      id: 's1',
      title: 'Develop multi agent system with Agent Development Kit',
      speaker: { name: 'Liam & Megan Kasselberg', role: 'Senior UX Writer & GDE', avatar: '' },
      track: 'AI / ML',
      room: 'Main Auditorium',
      time: '10:30 AM',
      description: 'Liam speaks with Megan Kasselberg, whose work as a senior UX writer touches billions.',
    },
    {
      id: 's2',
      title: 'From Docker to Docker Compose Workflows',
      speaker: { name: 'Sarah Lim', role: 'DevOps Lead @ TechScale', avatar: '' },
      track: 'Cloud & DevOps',
      room: 'Hall A (Tech Stage)',
      time: '11:30 AM',
      description: 'Learn best practices for multi-container orchestration and deployment security.',
    },
  ]);
});
