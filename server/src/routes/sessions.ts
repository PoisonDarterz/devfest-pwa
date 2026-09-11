import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const sessionsRouter = Router();

// =============================================================================
// Helper: Fetch RSVP counts map for all sessions from live DB
// =============================================================================
async function getRsvpCountsMap(): Promise<Map<string, number>> {
  const countsMap = new Map<string, number>();
  try {
    const { data, error } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('session_id')
      .neq('status', 'not_attending');

    if (!error && data) {
      for (const row of data) {
        const id = row.session_id;
        countsMap.set(id, (countsMap.get(id) || 0) + 1);
      }
    }
  } catch (err) {
    console.error('Failed to aggregate RSVP counts:', err);
  }
  return countsMap;
}

// =============================================================================
// 1. GET /api/sessions - List all conference sessions with live RSVP counts
// =============================================================================
sessionsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const track = req.query.track as string | undefined;

    let query = supabaseAdmin
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: true });

    if (track && track !== 'All') {
      query = query.eq('track', track);
    }

    const [{ data, error }, rsvpCounts] = await Promise.all([
      query,
      getRsvpCountsMap(),
    ]);

    if (error) {
      console.error('Database query failed for sessions:', error);
      res.status(500).json({ message: 'Failed to fetch conference sessions from database.', error: error.message });
      return;
    }

    const formatted = (data || []).map((s) => ({
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
      startTime: s.start_time || null,
      endTime: s.end_time || null,
      description: s.description || '',
      rsvpCount: rsvpCounts.get(s.id) || 0,
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error('Server error fetching sessions:', err);
    res.status(500).json({ message: 'Internal server error while fetching sessions.', error: err?.message });
  }
});

// =============================================================================
// 2. GET /api/sessions/saved - Fetch saved / RSVP'd session IDs for user
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
      .eq('user_email', email)
      .neq('status', 'not_attending');

    if (error) {
      console.error('Database query failed for user_saved_sessions:', error);
      res.status(500).json({ message: 'Failed to query saved sessions from database.', error: error.message });
      return;
    }

    const ids = (data || []).map((row) => row.session_id);
    res.json({ savedSessionIds: ids });
  } catch (err: any) {
    console.error('Server error in /sessions/saved:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});

// =============================================================================
// 3. POST /api/sessions/saved & POST /api/sessions/rsvp - Toggle RSVP / Save
// =============================================================================
const handleRsvpToggle = async (req: Request, res: Response): Promise<void> => {
  const { email, sessionId, status } = req.body;

  if (!email || !sessionId) {
    res.status(400).json({ message: 'Both email and sessionId are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Check if session is already saved/RSVP'd
    const { data: existing, error: checkErr } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('id, status')
      .eq('user_email', cleanEmail)
      .eq('session_id', sessionId)
      .limit(1);

    if (checkErr) {
      console.error('Error checking existing RSVP:', checkErr);
      res.status(500).json({ message: 'Database error checking session status.', error: checkErr.message });
      return;
    }

    let isSaved = false;

    if (existing && existing.length > 0) {
      if (status === 'attending') {
        // Update to attending if was not_attending
        await supabaseAdmin
          .from('user_saved_sessions')
          .update({ status: 'attending' })
          .eq('id', existing[0].id);
        isSaved = true;
      } else {
        // Default toggle or explicitly remove
        await supabaseAdmin
          .from('user_saved_sessions')
          .delete()
          .eq('user_email', cleanEmail)
          .eq('session_id', sessionId);
        isSaved = false;
      }
    } else {
      // Add new RSVP / Save
      const { error: insertErr } = await supabaseAdmin
        .from('user_saved_sessions')
        .insert({
          user_email: cleanEmail,
          session_id: sessionId,
          status: status || 'attending',
        });

      if (insertErr) {
        console.error('Error inserting RSVP into database:', insertErr);
        res.status(500).json({ message: 'Failed to record RSVP in database.', error: insertErr.message });
        return;
      }
      isSaved = true;
    }

    // Fetch updated saved sessions list for this user
    const { data: updated } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('session_id')
      .eq('user_email', cleanEmail)
      .neq('status', 'not_attending');

    const savedIds = updated ? updated.map((r) => r.session_id) : [];

    // Calculate live updated RSVP count for this session
    const { count } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .neq('status', 'not_attending');

    res.json({
      success: true,
      isSaved,
      isRsvpd: isSaved,
      savedSessionIds: savedIds,
      rsvpCount: count || 0,
      message: isSaved ? 'RSVP confirmed! Added to your schedule.' : 'RSVP cancelled. Removed from your schedule.',
    });
  } catch (err: any) {
    console.error('Server error in RSVP toggle:', err);
    res.status(500).json({ message: 'Internal server error while saving RSVP.', error: err?.message });
  }
};

sessionsRouter.post('/saved', handleRsvpToggle);
sessionsRouter.post('/rsvp', handleRsvpToggle);

// =============================================================================
// 4. GET /api/sessions/:id - Get single session details + RSVP count
// =============================================================================
sessionsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ message: 'Session not found.' });
      return;
    }

    const { count } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', id)
      .neq('status', 'not_attending');

    res.json({
      id: data.id,
      title: data.title,
      speaker: {
        name: data.speaker_name,
        role: data.speaker_role || '',
        avatar: data.speaker_avatar || '',
      },
      track: data.track,
      room: data.room,
      time: data.time,
      startTime: data.start_time || null,
      endTime: data.end_time || null,
      description: data.description || '',
      rsvpCount: count || 0,
    });
  } catch (err: any) {
    console.error('Server error fetching session details:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});

// =============================================================================
// 5. GET /api/sessions/:id/attendees - List RSVP'd attendees for a session
// =============================================================================
sessionsRouter.get('/:id/attendees', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // 1. Get RSVP rows
    const { data: rsvps, error: rsvpErr } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('user_email, created_at')
      .eq('session_id', id)
      .neq('status', 'not_attending');

    if (rsvpErr) {
      res.status(500).json({ message: 'Failed to fetch session RSVPs.', error: rsvpErr.message });
      return;
    }

    if (!rsvps || rsvps.length === 0) {
      res.json({ sessionId: id, attendees: [], totalAttendees: 0 });
      return;
    }

    const emails = rsvps.map((r) => r.user_email);

    // 2. Fetch attendee profiles
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, company_role, ticket_type')
      .in('email', emails);

    if (profErr) {
      console.warn('Could not fetch profiles for attendees:', profErr);
    }

    const profileMap = new Map((profiles || []).map((p) => [p.email.toLowerCase(), p]));

    const attendees = rsvps.map((r) => {
      const prof = profileMap.get(r.user_email.toLowerCase());
      return {
        email: r.user_email,
        name: prof?.full_name || r.user_email.split('@')[0],
        role: prof?.company_role || 'Attendee',
        ticketType: prof?.ticket_type || 'Standard Attendee',
        rsvpdAt: r.created_at,
      };
    });

    res.json({
      sessionId: id,
      attendees,
      totalAttendees: attendees.length,
    });
  } catch (err: any) {
    console.error('Server error fetching attendees:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});
