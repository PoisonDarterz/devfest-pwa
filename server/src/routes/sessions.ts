import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const sessionsRouter = Router();

// In-memory fallback for saved sessions if DB table is initializing
const inMemorySavedSessions: Map<string, Set<string>> = new Map();

// =============================================================================
// 1. GET /api/sessions - List all conference sessions
// =============================================================================
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
    console.warn('Failed to fetch sessions from DB, serving fallback:', err);
  }

  // Default sessions fallback
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
    {
      id: 's3',
      title: 'Getting Started with MCP, ADK and A2A Architectures',
      speaker: { name: 'Jonas Tan', role: 'Staff AI Engineer', avatar: '' },
      track: 'AI / ML',
      room: 'Hall B (Web Stage)',
      time: '02:00 PM',
      description: 'Explore Model Context Protocol (MCP), Agent Development Kit, and Agent-to-Agent protocol paradigms.',
    },
  ]);
});

// =============================================================================
// 2. GET /api/sessions/saved - Fetch saved session IDs for user
// =============================================================================
sessionsRouter.get('/saved', async (req: Request, res: Response): Promise<void> => {
  const email = (req.query.email as string)?.trim().toLowerCase();

  if (!email) {
    res.status(400).json({ message: 'User email is required.' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('session_id')
      .eq('user_email', email);

    if (!error && data) {
      const ids = data.map((row) => row.session_id);
      res.json({ savedSessionIds: ids });
      return;
    }
  } catch (err) {
    console.warn('Failed to query user_saved_sessions from DB, checking memory fallback:', err);
  }

  const userSet = inMemorySavedSessions.get(email) || new Set<string>();
  res.json({ savedSessionIds: Array.from(userSet) });
});

// =============================================================================
// 3. POST /api/sessions/saved - Toggle bookmarking a session
// =============================================================================
sessionsRouter.post('/saved', async (req: Request, res: Response): Promise<void> => {
  const { email, sessionId } = req.body;

  if (!email || !sessionId) {
    res.status(400).json({ message: 'Both email and sessionId are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Check if session is already saved
    const { data: existing, error: checkErr } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('id')
      .eq('user_email', cleanEmail)
      .eq('session_id', sessionId)
      .limit(1);

    if (!checkErr && existing && existing.length > 0) {
      // Remove bookmark
      await supabaseAdmin
        .from('user_saved_sessions')
        .delete()
        .eq('user_email', cleanEmail)
        .eq('session_id', sessionId);

      // Fetch updated list
      const { data: updated } = await supabaseAdmin
        .from('user_saved_sessions')
        .select('session_id')
        .eq('user_email', cleanEmail);

      const savedIds = updated ? updated.map((r) => r.session_id) : [];
      res.json({ isSaved: false, savedSessionIds: savedIds });
      return;
    } else {
      // Add bookmark
      await supabaseAdmin
        .from('user_saved_sessions')
        .insert({
          user_email: cleanEmail,
          session_id: sessionId,
        });

      // Fetch updated list
      const { data: updated } = await supabaseAdmin
        .from('user_saved_sessions')
        .select('session_id')
        .eq('user_email', cleanEmail);

      const savedIds = updated ? updated.map((r) => r.session_id) : [sessionId];
      res.json({ isSaved: true, savedSessionIds: savedIds });
      return;
    }
  } catch (err) {
    console.warn('DB operation on user_saved_sessions failed, using memory fallback:', err);
  }

  // Memory fallback
  if (!inMemorySavedSessions.has(cleanEmail)) {
    inMemorySavedSessions.set(cleanEmail, new Set<string>());
  }
  const userSet = inMemorySavedSessions.get(cleanEmail)!;
  let isSaved = false;

  if (userSet.has(sessionId)) {
    userSet.delete(sessionId);
    isSaved = false;
  } else {
    userSet.add(sessionId);
    isSaved = true;
  }

  res.json({ isSaved, savedSessionIds: Array.from(userSet) });
});
