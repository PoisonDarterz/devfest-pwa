import { supabase } from '../lib/supabase';
import type { AppNotification } from '../lib/types';
import { USE_NODE_BACKEND, NODE_API_BASE_URL } from './apiConfig';

export const notificationsService = {
  // Fetch all notifications with user read status and unread count
  async getNotifications(email?: string): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    const cleanEmail = email?.trim().toLowerCase();
    const emailParam = cleanEmail ? `?email=${encodeURIComponent(cleanEmail)}` : '';

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/notifications${emailParam}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Failed to fetch notifications from Node backend:', err);
      }
    }

    // Direct database fallback
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        let readSet = new Set<string>();

        if (cleanEmail) {
          const { data: reads } = await supabase
            .from('user_notification_reads')
            .select('notification_id')
            .eq('user_email', cleanEmail);

          if (reads) {
            reads.forEach((r: any) => readSet.add(r.notification_id));
          }
        }

        const formatted: AppNotification[] = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'organizer_announcement',
          targetTrack: n.target_track || 'All',
          scheduledAt: n.scheduled_at || n.created_at,
          createdAt: n.created_at,
          isRead: cleanEmail ? readSet.has(n.id) : false,
        }));

        const unreadCount = cleanEmail ? formatted.filter((n) => !n.isRead).length : 0;
        return { notifications: formatted, unreadCount };
      }
    } catch (err) {
      console.error('Database query failed for notifications:', err);
    }

    return { notifications: [], unreadCount: 0 };
  },

  // Mark single notification as read
  async markNotificationRead(email: string, notificationId: string): Promise<boolean> {
    if (!email || !notificationId) return false;
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/notifications/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, notificationId }),
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Failed to mark notification read via Node backend:', err);
      }
    }

    try {
      await supabase
        .from('user_notification_reads')
        .upsert({
          user_email: cleanEmail,
          notification_id: notificationId,
          read_at: new Date().toISOString(),
        }, { onConflict: 'user_email,notification_id' });
      return true;
    } catch (err) {
      console.warn('Database mark read failed:', err);
    }
    return false;
  },

  // Mark all notifications as read for user
  async markAllNotificationsRead(email: string): Promise<boolean> {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/notifications/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, markAll: true }),
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Failed to mark all notifications read via Node backend:', err);
      }
    }

    try {
      const { data: allNotifs } = await supabase.from('notifications').select('id');
      if (allNotifs && allNotifs.length > 0) {
        const rows = allNotifs.map((n: any) => ({
          user_email: cleanEmail,
          notification_id: n.id,
          read_at: new Date().toISOString(),
        }));
        await supabase
          .from('user_notification_reads')
          .upsert(rows, { onConflict: 'user_email,notification_id' });
        return true;
      }
    } catch (err) {
      console.warn('Database mark all read failed:', err);
    }
    return false;
  },

  // Broadcast announcement / notification
  async broadcastNotification(payload: {
    title: string;
    message: string;
    type?: string;
    targetTrack?: string;
  }): Promise<AppNotification | null> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          return data.notification;
        }
      } catch (err) {
        console.warn('Failed to broadcast notification via Node backend:', err);
      }
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: payload.title,
          message: payload.message,
          type: payload.type || 'organizer_announcement',
          target_track: payload.targetTrack || 'All',
        })
        .select();

      if (!error && data) {
        return data[0] as AppNotification;
      }
    } catch (err) {
      console.error('Database notification insert failed:', err);
    }
    return null;
  },
};
