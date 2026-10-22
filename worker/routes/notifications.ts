import { Hono } from 'hono';
import { getSupabaseAdmin } from '../db';
import type { Env } from '../types';

export const notificationsRouter = new Hono<{ Bindings: Env }>();

// =============================================================================
// 1. GET /api/notifications - List notifications and calculate unread for user
// =============================================================================
notificationsRouter.get('/', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const email = c.req.query('email')?.trim().toLowerCase();

  try {
    const { data: notifications, error: notifErr } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (notifErr) {
      console.error('Failed to fetch notifications from DB:', notifErr);
      return c.json({ message: 'Failed to fetch notifications.', error: notifErr.message }, 500);
    }

    const readSet = new Set<string>();

    if (email) {
      const { data: reads } = await supabaseAdmin
        .from('user_notification_reads')
        .select('notification_id')
        .eq('user_email', email);

      if (reads) {
        reads.forEach((r) => readSet.add(r.notification_id));
      }
    }

    const formatted = (notifications || []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type || 'organizer_announcement',
      targetTrack: n.target_track || 'All',
      scheduledAt: n.scheduled_at || n.created_at,
      createdAt: n.created_at,
      isRead: email ? readSet.has(n.id) : false,
    }));

    const unreadCount = email ? formatted.filter((n) => !n.isRead).length : 0;

    return c.json({
      notifications: formatted,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Server error in /api/notifications:', err);
    return c.json({ message: 'Internal server error.', error: err?.message }, 500);
  }
});

// =============================================================================
// 2. POST /api/notifications - Broadcast a new notification (Organizer/Admin)
// =============================================================================
notificationsRouter.post('/', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { title, message, type, targetTrack, scheduledAt } = body;

  if (!title || !message) {
    return c.json({ message: 'Title and message are required.' }, 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        title: title.trim(),
        message: message.trim(),
        type: type || 'organizer_announcement',
        target_track: targetTrack || 'All',
        scheduled_at: scheduledAt || new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Failed to insert notification:', error);
      return c.json({ message: 'Failed to broadcast notification.', error: error.message }, 500);
    }

    return c.json(
      {
        success: true,
        notification: data[0],
        message: 'Notification broadcasted successfully.',
      },
      201
    );
  } catch (err: any) {
    console.error('Server error creating notification:', err);
    return c.json({ message: 'Internal server error.', error: err?.message }, 500);
  }
});

// =============================================================================
// 3. POST /api/notifications/mark-read - Mark notification(s) as read
// =============================================================================
notificationsRouter.post('/mark-read', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { email, notificationId, markAll } = body;

  if (!email) {
    return c.json({ message: 'User email is required.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (markAll) {
      const { data: allNotifs } = await supabaseAdmin.from('notifications').select('id');

      if (allNotifs && allNotifs.length > 0) {
        const rows = allNotifs.map((n) => ({
          user_email: cleanEmail,
          notification_id: n.id,
          read_at: new Date().toISOString(),
        }));

        await supabaseAdmin
          .from('user_notification_reads')
          .upsert(rows, { onConflict: 'user_email,notification_id' });
      }

      return c.json({ success: true, unreadCount: 0, message: 'All notifications marked as read.' });
    }

    if (!notificationId) {
      return c.json({ message: 'Either notificationId or markAll must be provided.' }, 400);
    }

    await supabaseAdmin.from('user_notification_reads').upsert(
      {
        user_email: cleanEmail,
        notification_id: notificationId,
        read_at: new Date().toISOString(),
      },
      { onConflict: 'user_email,notification_id' }
    );

    const [allCount, readCount] = await Promise.all([
      supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('user_notification_reads')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', cleanEmail),
    ]);

    const unread = Math.max(0, (allCount.count || 0) - (readCount.count || 0));

    return c.json({ success: true, unreadCount: unread, message: 'Notification marked as read.' });
  } catch (err: any) {
    console.error('Server error marking notification read:', err);
    return c.json({ message: 'Internal server error.', error: err?.message }, 500);
  }
});

// =============================================================================
// 4. GET /api/notifications/upcoming-reminders - Get upcoming session reminders
// =============================================================================
notificationsRouter.get('/upcoming-reminders', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const email = c.req.query('email')?.trim().toLowerCase();

  if (!email) {
    return c.json({ message: 'User email is required.' }, 400);
  }

  try {
    const { data: saved, error: savedErr } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('session_id')
      .eq('user_email', email)
      .neq('status', 'not_attending');

    if (savedErr || !saved || saved.length === 0) {
      return c.json({ reminders: [] });
    }

    const sessionIds = saved.map((s) => s.session_id);

    const { data: sessions } = await supabaseAdmin.from('sessions').select('*').in('id', sessionIds);

    return c.json({
      savedSessionCount: sessionIds.length,
      sessions: sessions || [],
    });
  } catch (err: any) {
    console.error('Server error fetching upcoming reminders:', err);
    return c.json({ message: 'Internal server error.', error: err?.message }, 500);
  }
});
