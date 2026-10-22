import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../db.js';

export const notificationsRouter = Router();

// =============================================================================
// VAPID Web Push Configuration
// =============================================================================
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BGlGZhNt2_kafTHuVXzGfz7OqZBaLCHJK3bsRuIKlqwWb5K7AePOC5MvOqdznc_7uTcEk7mZofGaAwIf6AUvjls';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  '2089JZ9OAReh0uN5c-vHKsAIbebAHpMzuYVKzueSm5w';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:organizers@devfest.kl';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web Push (VAPID) service initialized successfully.');
} catch (err) {
  console.warn('[WebPush] Failed to initialize VAPID details:', err);
}

// Persistent Local File Fallback for Push Subscriptions
const DATA_DIR = path.resolve(
  process.cwd().endsWith('server') ? process.cwd() : path.join(process.cwd(), 'server'),
  'data'
);
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

export interface StoredPushSubscription {
  id: string;
  user_email: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at: string;
}

function getLocalSubscriptions(): StoredPushSubscription[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const content = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[WebPush] Error reading local subscriptions file:', err);
  }
  return [];
}

function saveLocalSubscriptions(subs: StoredPushSubscription[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[WebPush] Error saving local subscriptions file:', err);
  }
}

export async function getAllSubscriptions(targetEmail?: string): Promise<StoredPushSubscription[]> {
  const map = new Map<string, StoredPushSubscription>();

  // 1. Try Supabase push_subscriptions table
  try {
    let query = supabaseAdmin.from('push_subscriptions').select('*');
    if (targetEmail) {
      query = query.ilike('user_email', targetEmail.trim().toLowerCase());
    }
    const { data, error } = await query;
    if (!error && data) {
      for (const row of data) {
        map.set(row.endpoint, {
          id: row.id,
          user_email: row.user_email,
          endpoint: row.endpoint,
          p256dh: row.p256dh,
          auth: row.auth,
          user_agent: row.user_agent,
          created_at: row.created_at,
        });
      }
    }
  } catch {
    // Supabase table might not exist yet; fallback continues below
  }

  // 2. Merge local subscriptions file
  const local = getLocalSubscriptions();
  for (const s of local) {
    if (!targetEmail || s.user_email.toLowerCase() === targetEmail.trim().toLowerCase()) {
      if (!map.has(s.endpoint)) {
        map.set(s.endpoint, s);
      }
    }
  }

  return Array.from(map.values());
}

export async function deleteSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const local = getLocalSubscriptions().filter((s) => s.endpoint !== endpoint);
  saveLocalSubscriptions(local);

  try {
    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch {}
}

export async function sendWebPushToSubscriptions(
  subs: StoredPushSubscription[],
  payload: { title: string; body: string; icon?: string; badge?: string; url?: string; data?: any }
): Promise<{ sent: number; failed: number }> {
  if (subs.length === 0) return { sent: 0, failed: 0 };

  const pushPayload = JSON.stringify({
    title: payload.title || 'DevFest KL 2026',
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    data: {
      url: payload.url || '/',
      ...(payload.data || {}),
    },
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        await webpush.sendNotification(pushSubscription, pushPayload);
        sent++;
      } catch (err: any) {
        failed++;
        // 404 or 410 means the user unsubscribed or revoked notification access
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`[WebPush] Pruning expired subscription: ${sub.endpoint.slice(0, 45)}...`);
          await deleteSubscriptionByEndpoint(sub.endpoint);
        } else {
          console.warn(`[WebPush] Failed sending push to ${sub.user_email}:`, err?.message || err);
        }
      }
    })
  );

  console.log(`[WebPush] Sent ${sent} push notifications (${failed} failed) across ${subs.length} target devices.`);
  return { sent, failed };
}

// Track reminded sessions in memory to avoid duplicate alerts today
const sentSessionReminders = new Set<string>();

export async function checkAndDispatchSessionReminders(): Promise<number> {
  const now = new Date();
  let count = 0;

  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('sessions')
      .select('id, title, room, time, track');

    if (error || !sessions || sessions.length === 0) return 0;

    for (const sess of sessions) {
      if (!sess.time || typeof sess.time !== 'string') continue;
      const parts = sess.time.trim().split(' ');
      if (parts.length < 2) continue;
      const [hStr, mStr] = parts[0].split(':');
      let hours = parseInt(hStr, 10);
      const minutes = parseInt(mStr, 10);
      const modifier = parts[1].toUpperCase();

      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const sessionDate = new Date();
      sessionDate.setHours(hours, minutes, 0, 0);

      const diffMs = sessionDate.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);

      // If starting in 0 to 6 minutes
      if (diffMins > 0 && diffMins <= 6) {
        const { data: savedRows } = await supabaseAdmin
          .from('user_saved_sessions')
          .select('user_email')
          .eq('session_id', sess.id)
          .neq('status', 'not_attending');

        if (savedRows && savedRows.length > 0) {
          for (const row of savedRows) {
            const email = (row.user_email || '').toLowerCase().trim();
            if (!email) continue;
            const reminderKey = `${sess.id}:${email}`;
            if (sentSessionReminders.has(reminderKey)) continue;

            const userSubs = await getAllSubscriptions(email);
            if (userSubs.length > 0) {
              await sendWebPushToSubscriptions(userSubs, {
                title: `Starting Soon: ${sess.title}`,
                body: `Starts in 5 mins (${sess.time}) at ${sess.room}!`,
                url: '/',
                data: { sessionId: sess.id, type: 'session_reminder' },
              });
              count++;
            }
            sentSessionReminders.add(reminderKey);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[WebPush] Error running session reminders check:', err);
  }

  return count;
}

// =============================================================================
// API Endpoints
// =============================================================================

// 1. GET /api/notifications/vapid-public-key
notificationsRouter.get('/vapid-public-key', (_req: Request, res: Response): void => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// 2. POST /api/notifications/subscribe - Register device push subscription
notificationsRouter.post('/subscribe', async (req: Request, res: Response): Promise<void> => {
  const { email, subscription, userAgent } = req.body;

  if (!email || !subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    res.status(400).json({ message: 'Valid email and push subscription details (endpoint, p256dh, auth) are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;

  const newSub: StoredPushSubscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_email: cleanEmail,
    endpoint,
    p256dh,
    auth,
    user_agent: userAgent || req.headers['user-agent'] || '',
    created_at: new Date().toISOString(),
  };

  // 1. Save locally in JSON fallback
  const local = getLocalSubscriptions().filter((s) => s.endpoint !== endpoint);
  local.push(newSub);
  saveLocalSubscriptions(local);

  // 2. Save in Supabase push_subscriptions table
  try {
    await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          user_email: cleanEmail,
          endpoint,
          p256dh,
          auth,
          user_agent: newSub.user_agent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );
  } catch (err) {
    console.warn('[WebPush] Failed saving subscription in Supabase (local file active):', err);
  }

  res.status(201).json({
    success: true,
    message: 'Web push subscription successfully registered on device.',
  });
});

// 3. POST /api/notifications/unsubscribe - Remove subscription
notificationsRouter.post('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ message: 'Endpoint is required.' });
    return;
  }

  await deleteSubscriptionByEndpoint(endpoint);
  res.json({ success: true, message: 'Push subscription removed.' });
});

// 4. POST /api/notifications/test-push - Send a test push to user's registered devices
notificationsRouter.post('/test-push', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required for test push.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const subs = await getAllSubscriptions(cleanEmail);

  if (subs.length === 0) {
    res.status(404).json({
      success: false,
      message: 'No active push subscriptions found for this email. Tap "Enable Device Notifications" first.',
    });
    return;
  }

  const { sent, failed } = await sendWebPushToSubscriptions(subs, {
    title: '🔔 DevFest KL 2026 Test Alert',
    body: 'Lockscreen Web Push is working! You will receive live updates even when the app is closed.',
    url: '/',
  });

  res.json({
    success: sent > 0,
    devicesFound: subs.length,
    sent,
    failed,
    message: sent > 0
      ? `Successfully delivered Web Push to ${sent} registered device(s)!`
      : 'Failed to deliver Web Push to registered device.',
  });
});

// 5. POST /api/notifications/check-session-reminders - Trigger upcoming session push alerts
notificationsRouter.post('/check-session-reminders', async (_req: Request, res: Response): Promise<void> => {
  const sentCount = await checkAndDispatchSessionReminders();
  res.json({ success: true, remindersDispatched: sentCount });
});

// 6. GET /api/notifications - List notifications and calculate unread count for user
notificationsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const email = (req.query.email as string)?.trim().toLowerCase();

  try {
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

    res.json({
      notifications: formatted,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Server error in /api/notifications:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});

// 7. POST /api/notifications - Broadcast a new notification (Organizer/Admin) & Push to all devices
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

    // Automatically trigger Web Push to ALL registered devices (even when app is closed)
    getAllSubscriptions()
      .then((subs) => {
        sendWebPushToSubscriptions(subs, {
          title: title.trim(),
          body: message.trim(),
          url: '/',
          data: {
            type: type || 'organizer_announcement',
            targetTrack: targetTrack || 'All',
          },
        }).catch((pushErr) => {
          console.warn('[WebPush] Error during broadcast push dispatch:', pushErr);
        });
      })
      .catch((e) => console.warn('[WebPush] Error fetching subscriptions for broadcast:', e));

    res.status(201).json({
      success: true,
      notification: data[0],
      message: 'Notification broadcasted and sent to all attendee devices via Web Push.',
    });
  } catch (err: any) {
    console.error('Server error creating notification:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});

// 8. POST /api/notifications/mark-read - Mark notification(s) as read
notificationsRouter.post('/mark-read', async (req: Request, res: Response): Promise<void> => {
  const { email, notificationId, markAll } = req.body;

  if (!email) {
    res.status(400).json({ message: 'User email is required.' });
    return;
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

      res.json({ success: true, unreadCount: 0, message: 'All notifications marked as read.' });
      return;
    }

    if (!notificationId) {
      res.status(400).json({ message: 'Either notificationId or markAll must be provided.' });
      return;
    }

    await supabaseAdmin
      .from('user_notification_reads')
      .upsert(
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

    res.json({ success: true, unreadCount: unread, message: 'Notification marked as read.' });
  } catch (err: any) {
    console.error('Server error marking notification read:', err);
    res.status(500).json({ message: 'Internal server error.', error: err?.message });
  }
});

// 9. GET /api/notifications/upcoming-reminders
notificationsRouter.get('/upcoming-reminders', async (req: Request, res: Response): Promise<void> => {
  const email = (req.query.email as string)?.trim().toLowerCase();

  if (!email) {
    res.status(400).json({ message: 'User email is required.' });
    return;
  }

  try {
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
