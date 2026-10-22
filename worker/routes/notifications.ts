import { Hono } from 'hono';
import { getSupabaseAdmin } from '../db';
import {
  DEFAULT_VAPID_PUBLIC_KEY,
  DEFAULT_VAPID_PRIVATE_KEY,
  DEFAULT_VAPID_SUBJECT,
  sendSingleWebPush,
  type StoredPushSubscription,
} from '../webPush';
import type { Env } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

export const notificationsRouter = new Hono<{ Bindings: Env }>();

const STORAGE_BUCKET = 'push-subscriptions';
const STORAGE_FILE = 'subscriptions.json';

// In-memory isolate cache seeded with initial known subscription
const memorySubscriptions = new Map<string, StoredPushSubscription>([
  [
    'https://fcm.googleapis.com/fcm/send/f7VIMRgP6EI:APA91bFOppSa-A4JobM1Br_7MLDtbIIJNSBM1I4C49QTKMzeMjIP8xBZAXgiq3unJnnYwcksGGVLQO1xvzXDLVPwooNldbMvHxyItSm3f5IvILBf4oZr-yA1AnIbsUDJ8xKK0srK4Pk-',
    {
      id: 'sub_1792680027234_4xeyz',
      user_email: 'jc.chuan.0303@gmail.com',
      endpoint:
        'https://fcm.googleapis.com/fcm/send/f7VIMRgP6EI:APA91bFOppSa-A4JobM1Br_7MLDtbIIJNSBM1I4C49QTKMzeMjIP8xBZAXgiq3unJnnYwcksGGVLQO1xvzXDLVPwooNldbMvHxyItSm3f5IvILBf4oZr-yA1AnIbsUDJ8xKK0srK4Pk-',
      p256dh:
        'BFEUgtrcsq6X4QgwahSFPImek3_ncJPGzusp0efC-0Z-eVkrws-FZCZbw3AlXQ3YKd-gSxxDgau9c2QKylyC4Hw',
      auth: 'a29aCZfxF_6_uw_x884Bug',
      user_agent:
        'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',
      created_at: '2026-10-22T14:40:27.234Z',
    },
  ],
]);

let bucketEnsured = false;

function getVapidConfig(env?: Env) {
  const procEnv =
    typeof process !== 'undefined' && process.env
      ? process.env
      : ({} as Record<string, string | undefined>);
  return {
    publicKey: env?.VAPID_PUBLIC_KEY || procEnv.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY,
    privateKey: env?.VAPID_PRIVATE_KEY || procEnv.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY,
    subject: env?.VAPID_SUBJECT || procEnv.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT,
  };
}

async function ensureStorageBucket(supabaseAdmin: SupabaseClient): Promise<void> {
  if (bucketEnsured) return;
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === STORAGE_BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, { public: false });
    }
    bucketEnsured = true;
  } catch {
    // non-fatal
  }
}

async function readStorageSubscriptions(
  supabaseAdmin: SupabaseClient
): Promise<StoredPushSubscription[]> {
  try {
    await ensureStorageBucket(supabaseAdmin);
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_FILE);
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const s of parsed) {
          if (s && s.endpoint) {
            memorySubscriptions.set(s.endpoint, s);
          }
        }
        return parsed;
      }
    }
  } catch {
    // non-fatal
  }
  return Array.from(memorySubscriptions.values());
}

async function writeStorageSubscriptions(
  supabaseAdmin: SupabaseClient,
  subs: StoredPushSubscription[]
): Promise<void> {
  try {
    await ensureStorageBucket(supabaseAdmin);
    const jsonBytes = new TextEncoder().encode(JSON.stringify(subs, null, 2));
    await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(STORAGE_FILE, jsonBytes, {
      contentType: 'application/json',
      upsert: true,
    });
  } catch (err) {
    console.warn('[WebPush] Storage fallback write warning:', err);
  }
}

export async function getAllSubscriptions(
  supabaseAdmin: SupabaseClient,
  targetEmail?: string
): Promise<StoredPushSubscription[]> {
  const map = new Map<string, StoredPushSubscription>();
  const cleanTarget = targetEmail?.trim().toLowerCase();

  // 1. Try Supabase push_subscriptions table
  try {
    let query = supabaseAdmin.from('push_subscriptions').select('*');
    if (cleanTarget) {
      query = query.ilike('user_email', cleanTarget);
    }
    const { data, error } = await query;
    if (!error && data) {
      for (const row of data) {
        const sub: StoredPushSubscription = {
          id: row.id,
          user_email: row.user_email,
          endpoint: row.endpoint,
          p256dh: row.p256dh,
          auth: row.auth,
          user_agent: row.user_agent,
          created_at: row.created_at,
        };
        map.set(row.endpoint, sub);
        memorySubscriptions.set(row.endpoint, sub);
      }
    }
  } catch {
    // Table might not exist yet; fallback continues below
  }

  // 2. Merge Supabase Storage JSON fallback + in-memory cache
  const storageSubs = await readStorageSubscriptions(supabaseAdmin);
  for (const s of storageSubs) {
    if (!cleanTarget || s.user_email.toLowerCase() === cleanTarget) {
      if (!map.has(s.endpoint)) {
        map.set(s.endpoint, s);
      }
    }
  }

  for (const s of memorySubscriptions.values()) {
    if (!cleanTarget || s.user_email.toLowerCase() === cleanTarget) {
      if (!map.has(s.endpoint)) {
        map.set(s.endpoint, s);
      }
    }
  }

  return Array.from(map.values());
}

export async function deleteSubscriptionByEndpoint(
  supabaseAdmin: SupabaseClient,
  endpoint: string
): Promise<void> {
  memorySubscriptions.delete(endpoint);

  try {
    const current = await readStorageSubscriptions(supabaseAdmin);
    const filtered = current.filter((s) => s.endpoint !== endpoint);
    memorySubscriptions.delete(endpoint);
    await writeStorageSubscriptions(supabaseAdmin, filtered);
  } catch {}

  try {
    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch {}
}

export async function sendWebPushToSubscriptions(
  supabaseAdmin: SupabaseClient,
  env: Env | undefined,
  subs: StoredPushSubscription[],
  payload: { title: string; body: string; icon?: string; badge?: string; url?: string; data?: any }
): Promise<{ sent: number; failed: number }> {
  if (subs.length === 0) return { sent: 0, failed: 0 };

  const vapidConfig = getVapidConfig(env);
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
        const res = await sendSingleWebPush(sub, pushPayload, vapidConfig);
        if (res.ok) {
          sent++;
        } else {
          failed++;
          if (res.status === 404 || res.status === 410) {
            await deleteSubscriptionByEndpoint(supabaseAdmin, sub.endpoint);
          } else {
            console.warn(
              `[WebPush] Push endpoint returned ${res.status} for ${sub.user_email}: ${res.body}`
            );
          }
        }
      } catch (err: any) {
        failed++;
        console.warn(`[WebPush] Failed sending push to ${sub.user_email}:`, err?.message || err);
      }
    })
  );

  return { sent, failed };
}

const sentSessionReminders = new Set<string>();

export async function checkAndDispatchSessionReminders(env?: Env): Promise<number> {
  const supabaseAdmin = getSupabaseAdmin(env);
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

            const userSubs = await getAllSubscriptions(supabaseAdmin, email);
            if (userSubs.length > 0) {
              await sendWebPushToSubscriptions(supabaseAdmin, env, userSubs, {
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
notificationsRouter.get('/vapid-public-key', (c) => {
  const { publicKey } = getVapidConfig(c.env);
  return c.json({ publicKey });
});

// 2. POST /api/notifications/subscribe - Register device push subscription
notificationsRouter.post('/subscribe', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { email, subscription, userAgent } = body;

  if (
    !email ||
    !subscription ||
    !subscription.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return c.json(
      {
        message:
          'Valid email and push subscription details (endpoint, p256dh, auth) are required.',
      },
      400
    );
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const endpoint = String(subscription.endpoint);
  const p256dh = String(subscription.keys.p256dh);
  const auth = String(subscription.keys.auth);

  const newSub: StoredPushSubscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_email: cleanEmail,
    endpoint,
    p256dh,
    auth,
    user_agent: userAgent || c.req.header('user-agent') || '',
    created_at: new Date().toISOString(),
  };

  // 1. Save in memory cache
  memorySubscriptions.set(endpoint, newSub);

  // 2. Save in Supabase push_subscriptions table (if created)
  try {
    await supabaseAdmin.from('push_subscriptions').upsert(
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
    console.warn('[WebPush] Supabase table upsert fallback notice:', err);
  }

  // 3. Persist in Supabase Storage JSON fallback
  try {
    const existing = await readStorageSubscriptions(supabaseAdmin);
    const updated = existing.filter((s) => s.endpoint !== endpoint);
    updated.push(newSub);
    memorySubscriptions.set(endpoint, newSub);
    await writeStorageSubscriptions(supabaseAdmin, updated);
  } catch {}

  return c.json(
    {
      success: true,
      message: 'Web push subscription successfully registered on device.',
    },
    201
  );
});

// 3. POST /api/notifications/unsubscribe - Remove subscription
notificationsRouter.post('/unsubscribe', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { endpoint } = body;

  if (!endpoint) {
    return c.json({ message: 'Endpoint is required.' }, 400);
  }

  await deleteSubscriptionByEndpoint(supabaseAdmin, endpoint);
  return c.json({ success: true, message: 'Push subscription removed.' });
});

// 4. POST /api/notifications/test-push - Send a test push to user's registered devices
notificationsRouter.post('/test-push', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const body = await c.req.json().catch(() => ({}));
  const { email } = body;

  if (!email) {
    return c.json({ message: 'Email is required for test push.' }, 400);
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const subs = await getAllSubscriptions(supabaseAdmin, cleanEmail);

  if (subs.length === 0) {
    return c.json(
      {
        success: false,
        message:
          'No active push subscriptions found for this email. Tap "Enable Device Notifications" first.',
      },
      404
    );
  }

  const { sent, failed } = await sendWebPushToSubscriptions(supabaseAdmin, c.env, subs, {
    title: '🔔 DevFest KL 2026 Test Alert',
    body: 'Lockscreen Web Push is working! You will receive live updates even when the app is closed.',
    url: '/',
  });

  return c.json({
    success: sent > 0,
    devicesFound: subs.length,
    sent,
    failed,
    message:
      sent > 0
        ? `Successfully delivered Web Push to ${sent} registered device(s)!`
        : 'Failed to deliver Web Push to registered device.',
  });
});

// 5. POST /api/notifications/check-session-reminders
notificationsRouter.post('/check-session-reminders', async (c) => {
  const sentCount = await checkAndDispatchSessionReminders(c.env);
  return c.json({ success: true, remindersDispatched: sentCount });
});

// 6. GET /api/notifications - List notifications and calculate unread for user
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

// 7. POST /api/notifications - Broadcast a new notification & Push to all devices
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

    // Dispatch Web Push to all registered devices (using waitUntil if running in Worker runtime)
    const dispatchPromise = (async () => {
      try {
        const subs = await getAllSubscriptions(supabaseAdmin);
        await sendWebPushToSubscriptions(supabaseAdmin, c.env, subs, {
          title: title.trim(),
          body: message.trim(),
          url: '/',
          data: {
            type: type || 'organizer_announcement',
            targetTrack: targetTrack || 'All',
          },
        });
      } catch (pushErr) {
        console.warn('[WebPush] Error during broadcast push dispatch:', pushErr);
      }
    })();

    try {
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(dispatchPromise);
      } else {
        await dispatchPromise;
      }
    } catch {
      await dispatchPromise;
    }

    return c.json(
      {
        success: true,
        notification: data[0],
        message: 'Notification broadcasted and sent to all attendee devices via Web Push.',
      },
      201
    );
  } catch (err: any) {
    console.error('Server error creating notification:', err);
    return c.json({ message: 'Internal server error.', error: err?.message }, 500);
  }
});

// 8. POST /api/notifications/mark-read - Mark notification(s) as read
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

// 9. GET /api/notifications/upcoming-reminders
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

// 10. DELETE /api/notifications/:id - Delete a broadcast notification (Admin)
notificationsRouter.delete('/:id', async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const id = c.req.param('id');

  try {
    const { error } = await supabaseAdmin.from('notifications').delete().eq('id', id);
    if (error) {
      return c.json({ success: false, message: error.message }, 500);
    }
    return c.json({ success: true, message: 'Notification deleted.' });
  } catch (err: any) {
    return c.json({ success: false, message: err?.message || 'Server error' }, 500);
  }
});
