import { supabase } from '../lib/supabase';
import type { Session } from '../lib/types';
import { USE_NODE_BACKEND, NODE_API_BASE_URL } from './apiConfig';

export const sessionsService = {
  // Fetch Sessions Agenda
  async getSessions(track?: string): Promise<Session[]> {
    const trackParam = track && track !== 'All' ? `?track=${encodeURIComponent(track)}` : '';

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions${trackParam}`);
        if (res.ok) {
          const sessions = await res.json();
          return sessions.map((s: any) => ({
            ...s,
            rsvpCount: s.rsvpCount || 0,
          }));
        }
      } catch (err) {
        console.error('Node backend fetch failed for sessions:', err);
      }
    }

    try {
      let query = supabase.from('sessions').select('*').order('created_at', { ascending: true });
      if (track && track !== 'All') {
        query = query.eq('track', track);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map((s) => ({
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
          rsvpCount: 0,
        })) as Session[];
      }
    } catch (err) {
      console.error('Database query failed for sessions:', err);
    }
    return [];
  },

  // Fetch Saved Session IDs for User
  async getSavedSessions(email: string): Promise<string[]> {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions/saved?email=${encodeURIComponent(cleanEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.savedSessionIds)) {
            localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(data.savedSessionIds));
            return data.savedSessionIds;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch saved sessions from Node backend:', err);
      }
    }

    try {
      const { data, error } = await supabase
        .from('user_saved_sessions')
        .select('session_id')
        .eq('user_email', cleanEmail);

      if (!error && data) {
        const ids = data.map((r) => r.session_id);
        localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(ids));
        return ids;
      }
    } catch (err) {
      console.warn('Supabase query failed for saved sessions:', err);
    }

    try {
      const cached = localStorage.getItem(`devfest_saved_sessions_${cleanEmail}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  // Toggle Save / RSVP Conference Session
  async toggleSaveSession(
    email: string,
    sessionId: string,
    status?: string
  ): Promise<{ isSaved: boolean; isRsvpd: boolean; savedSessionIds: string[]; rsvpCount?: number }> {
    if (!email || !sessionId) return { isSaved: false, isRsvpd: false, savedSessionIds: [] };
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, sessionId, status }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.savedSessionIds)) {
            localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(data.savedSessionIds));
            return {
              isSaved: data.isSaved,
              isRsvpd: data.isRsvpd ?? data.isSaved,
              savedSessionIds: data.savedSessionIds,
              rsvpCount: data.rsvpCount,
            };
          }
        }
      } catch (err) {
        console.warn('Failed to toggle saved session on Node backend:', err);
      }
    }

    // Direct database fallback
    try {
      const { data: existing } = await supabase
        .from('user_saved_sessions')
        .select('id')
        .eq('user_email', cleanEmail)
        .eq('session_id', sessionId)
        .limit(1);

      let isSaved = false;
      if (existing && existing.length > 0) {
        await supabase
          .from('user_saved_sessions')
          .delete()
          .eq('user_email', cleanEmail)
          .eq('session_id', sessionId);
        isSaved = false;
      } else {
        await supabase
          .from('user_saved_sessions')
          .insert({ user_email: cleanEmail, session_id: sessionId, status: 'attending' });
        isSaved = true;
      }

      const { data: allSaved } = await supabase
        .from('user_saved_sessions')
        .select('session_id')
        .eq('user_email', cleanEmail)
        .neq('status', 'not_attending');

      const savedIds = allSaved ? allSaved.map((r) => r.session_id) : [];
      localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(savedIds));

      return { isSaved, isRsvpd: isSaved, savedSessionIds: savedIds };
    } catch (dbErr) {
      console.warn('Database RSVP toggle failed:', dbErr);
    }

    // LocalStorage fallback
    const current = await sessionsService.getSavedSessions(cleanEmail);
    const alreadySaved = current.includes(sessionId);
    const updated = alreadySaved ? current.filter((id) => id !== sessionId) : [...current, sessionId];
    localStorage.setItem(`devfest_saved_sessions_${cleanEmail}`, JSON.stringify(updated));

    return { isSaved: !alreadySaved, isRsvpd: !alreadySaved, savedSessionIds: updated };
  },

  // RSVP to a conference session (Semantic alias to toggleSaveSession)
  async rsvpSession(email: string, sessionId: string, status: 'attending' | 'not_attending' = 'attending') {
    return sessionsService.toggleSaveSession(email, sessionId, status);
  },

  // Get Attendees for a specific session
  async getSessionAttendees(sessionId: string): Promise<{ sessionId: string; attendees: any[]; totalAttendees: number }> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/sessions/${sessionId}/attendees`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Failed to fetch session attendees from Node backend:', err);
      }
    }
    return { sessionId, attendees: [], totalAttendees: 0 };
  },
};
