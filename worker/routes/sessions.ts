import { Hono } from 'hono';
import { getSupabaseAdmin } from '../db';
import type { Env } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

export const sessionsRouter = new Hono<{ Bindings: Env }>();

// =============================================================================
// Helper: Fetch RSVP counts map for all sessions from live DB
// =============================================================================
async function getRsvpCountsMap(supabaseAdmin: SupabaseClient): Promise<Map<string, number>> {
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
sessionsRouter.get('/', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  try {
    const track = c.req.query('track');

    let query = supabaseAdmin
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: true });

    if (track && track !== 'All') {
      query = query.eq('track', track);
    }

    const [{ data, error }, rsvpCounts] = await Promise.all([
      query,
      getRsvpCountsMap(supabaseAdmin),
    ]);

    if (error) {
      console.error('Database query failed for sessions:', error);
      return c.json(
        { message: 'Failed to fetch conference sessions from database.', error: error.message },
        500
      );
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

    return c.json(formatted);
  } catch (err: any) {
    console.error('Server error fetching sessions:', err);
    return c.json({ message: 'Internal server error while fetching sessions.', error: err?.message }, 500);
  }
});

// =============================================================================
// 2. GET /api/sessions/saved - Fetch saved / RSVP'd session IDs for user
// =============================================================================
sessionsRouter.get('/saved', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const email = c.req.query('email')?.trim().toLowerCase();

  if (!email) {
    return c.json({ message: 'User email is required.' }, 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('session_id')
      .eq('user_email', email)
      .neq('status', 'not_attending');

    if (error) {
      console.error('Database query failed for user_saved_sessions:', error);
      return c.json({ message: 'Failed to query saved sessions from database.', error: error.message }, 500);
    }

    const ids = (data || []).map((row) => row.session_id);
    return c.json({ savedSessionIds: ids });
  } catch (err: any) {
    console.error('Server error in /sessions/saved:', err);
    return c.json({ message: 'Internal server error.', error: err?.message }, 500);
  }
});

// =============================================================================
// 3. POST /api/sessions/saved & POST /api/sessions/rsvp - Toggle RSVP / Save
// =============================================================================
const handleRsvpToggle = async (c: any) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { email, sessionId, status } = body;

  if (!email || !sessionId) {
    return c.json({ message: 'Both email and sessionId are required.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data: existing, error: checkErr } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('id, status')
      .eq('user_email', cleanEmail)
      .eq('session_id', sessionId)
      .limit(1);

    if (checkErr) {
      console.error('Error checking existing RSVP:', checkErr);
      return c.json({ message: 'Database error checking session status.', error: checkErr.message }, 500);
    }

    let isSaved = false;

    if (existing && existing.length > 0) {
      if (status === 'attending') {
        await supabaseAdmin
          .from('user_saved_sessions')
          .update({ status: 'attending' })
          .eq('id', existing[0].id);
        isSaved = true;
      } else {
        await supabaseAdmin
          .from('user_saved_sessions')
          .delete()
          .eq('user_email', cleanEmail)
          .eq('session_id', sessionId);
        isSaved = false;
      }
    } else {
      const { error: insertErr } = await supabaseAdmin.from('user_saved_sessions').insert({
        user_email: cleanEmail,
        session_id: sessionId,
        status: status || 'attending',
      });

      if (insertErr) {
        console.error('Error inserting RSVP into database:', insertErr);
        return c.json({ message: 'Failed to record RSVP in database.', error: insertErr.message }, 500);
      }
      isSaved = true;
    }

    const { data: updated } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('session_id')
      .eq('user_email', cleanEmail)
      .neq('status', 'not_attending');

    const savedIds = updated ? updated.map((r) => r.session_id) : [];

    const { count } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .neq('status', 'not_attending');

    return c.json({
      success: true,
      isSaved,
      isRsvpd: isSaved,
      savedSessionIds: savedIds,
      rsvpCount: count || 0,
      message: isSaved ? 'RSVP confirmed! Added to your schedule.' : 'RSVP cancelled. Removed from your schedule.',
    });
  } catch (err: any) {
    console.error('Server error in RSVP toggle:', err);
    return c.json({ message: 'Internal server error while saving RSVP.', error: err?.message }, 500);
  }
};

sessionsRouter.post('/saved', handleRsvpToggle);
sessionsRouter.post('/rsvp', handleRsvpToggle);

// =============================================================================
// 4. GET /api/sessions/:id - Get single session details + RSVP count
// =============================================================================
sessionsRouter.get('/:id', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const id = c.req.param('id');

  try {
    const { data, error } = await supabaseAdmin.from('sessions').select('*').eq('id', id).single();

    if (error || !data) {
      return c.json({ message: 'Session not found.' }, 404);
    }

    const { count } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', id)
      .neq('status', 'not_attending');

    return c.json({
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
    return c.json({ message: 'Internal server error.', error: err?.message }, 500);
  }
});

// =============================================================================
// 5. GET /api/sessions/:id/attendees - List RSVP'd attendees for a session
// =============================================================================
sessionsRouter.get('/:id/attendees', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const id = c.req.param('id');

  try {
    const { data: rsvps, error: rsvpErr } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('user_email, created_at')
      .eq('session_id', id)
      .neq('status', 'not_attending');

    if (rsvpErr) {
      return c.json({ message: 'Failed to fetch session RSVPs.', error: rsvpErr.message }, 500);
    }

    if (!rsvps || rsvps.length === 0) {
      return c.json({ sessionId: id, attendees: [], totalAttendees: 0 });
    }

    const emails = rsvps.map((r) => r.user_email);

    const [profilesRes, whitelistRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('email, full_name, company_role').in('email', emails),
      supabaseAdmin.from('ticketing_whitelists').select('email, ticket_type').in('email', emails),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.email.toLowerCase(), p]));
    const whitelistMap = new Map((whitelistRes.data || []).map((w) => [w.email.toLowerCase(), w.ticket_type]));

    const attendees = rsvps.map((r) => {
      const emailLower = r.user_email.toLowerCase();
      const prof = profileMap.get(emailLower);
      return {
        email: r.user_email,
        name: prof?.full_name || r.user_email.split('@')[0],
        role: prof?.company_role || 'Attendee',
        ticketType: whitelistMap.get(emailLower) || 'Standard Attendee',
        rsvpdAt: r.created_at,
      };
    });

    return c.json({
      sessionId: id,
      attendees,
      totalAttendees: attendees.length,
    });
  } catch (err: any) {
    console.error('Server error fetching attendees:', err);
    return c.json({ message: 'Internal server error.', error: err?.message }, 500);
  }
});
