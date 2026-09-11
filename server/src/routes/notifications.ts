import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db.js';

export const notificationsRouter = Router();

// =============================================================================
// 1. GET /api/notifications - List notifications and calculate unread for user
// =============================================================================
notificationsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const email = (req.query.email as string)?.trim().toLowerCase();

  try {
    // 1. Fetch broadcast notifications from DB
    const { data: notifications, error: notifErr } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (notifErr) {
      console.error('Failed to fetch notifications from DB:', notifErr);
      res.status(500).json({ message: 'Failed to fetch notifications.', error: notifErr.message });
      return;
    }

    let readSet = new Set<string>();

    if (email) {
      // 2. Fetch read receipts for this user
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

    const unreadCount = email
      ? formatted.filter((n) => !n.isRead).length
      : 0;

    res.json({
      notifications: formatted,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Server error in /api/notifications:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});

// =============================================================================
// 2. POST /api/notifications - Broadcast a new notification (Organizer/Admin)
// =============================================================================
notificationsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { title, message, type, targetTrack, scheduledAt } = req.body;

  if (!title || !message) {
    res.status(400).json({ message: 'Title and message are required.' });
    return;
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
      res.status(500).json({ message: 'Failed to broadcast notification.', error: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      notification: data[0],
      message: 'Notification broadcasted successfully.',
    });
  } catch (err: any) {
    console.error('Server error creating notification:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});

// =============================================================================
// 3. POST /api/notifications/mark-read - Mark notification(s) as read
// =============================================================================
notificationsRouter.post('/mark-read', async (req: Request, res: Response): Promise<void> => {
  const { email, notificationId, markAll } = req.body;

  if (!email) {
    res.status(400).json({ message: 'User email is required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (markAll) {
      // Get all active notification IDs
      const { data: allNotifs } = await supabaseAdmin
        .from('notifications')
        .select('id');

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

      res.json({ success: true, unreadCount: 0, message: 'All notifications marked as read.' });
      return;
    }

    if (!notificationId) {
      res.status(400).json({ message: 'Either notificationId or markAll must be provided.' });
      return;
    }

    await supabaseAdmin
      .from('user_notification_reads')
      .upsert({
        user_email: cleanEmail,
        notification_id: notificationId,
        read_at: new Date().toISOString(),
      }, { onConflict: 'user_email,notification_id' });

    // Calculate remaining unread count
    const [allCount, readCount] = await Promise.all([
      supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('user_notification_reads').select('*', { count: 'exact', head: true }).eq('user_email', cleanEmail),
    ]);

    const unread = Math.max(0, (allCount.count || 0) - (readCount.count || 0));

    res.json({ success: true, unreadCount: unread, message: 'Notification marked as read.' });
  } catch (err: any) {
    console.error('Server error marking notification read:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});

// =============================================================================
// 4. GET /api/notifications/upcoming-reminders - Get upcoming session reminders
// =============================================================================
notificationsRouter.get('/upcoming-reminders', async (req: Request, res: Response): Promise<void> => {
  const email = (req.query.email as string)?.trim().toLowerCase();

  if (!email) {
    res.status(400).json({ message: 'User email is required.' });
    return;
  }

  try {
    // 1. Get user's saved/RSVP session IDs
    const { data: saved, error: savedErr } = await supabaseAdmin
      .from('user_saved_sessions')
      .select('session_id')
      .eq('user_email', email)
      .neq('status', 'not_attending');

    if (savedErr || !saved || saved.length === 0) {
      res.json({ reminders: [] });
      return;
    }

    const sessionIds = saved.map((s) => s.session_id);

    // 2. Fetch session details
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .in('id', sessionIds);

    res.json({
      savedSessionCount: sessionIds.length,
      sessions: sessions || [],
    });
  } catch (err: any) {
    console.error('Server error fetching upcoming reminders:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});
