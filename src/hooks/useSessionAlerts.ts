import { useState, useEffect } from 'react';
import type { Session } from '../lib/types';
import { sendSystemNotification } from '../lib/notifications';

export const useSessionAlerts = (sessions: Session[], savedSessionIds: string[]) => {
  const [activeAlert, setActiveAlert] = useState<Session | null>(null);

  // Manual simulation for testing reminders
  const handleSimulateAlert = (session: Session) => {
    setActiveAlert(session);
    sendSystemNotification('DevFest KL 2026', {
      body: `Starting Soon: "${session.title}" at ${session.time} in ${session.room}!`,
      icon: '/pwa-192x192.png',
    }).catch(() => {});
  };

  // Foreground/Background periodic checker for upcoming sessions starting in less than 5 minutes
  useEffect(() => {
    if (sessions.length === 0) return;

    const parseSessionTimeToToday = (timeStr: string): Date => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      return today;
    };

    const checkUpcomingSessions = () => {
      const now = new Date();
      let reminded: string[] = [];
      try {
        const stored = localStorage.getItem('devfest_reminded_sessions');
        reminded = stored ? JSON.parse(stored) : [];
      } catch {}

      sessions.forEach((sess) => {
        if (savedSessionIds.includes(sess.id) && !reminded.includes(sess.id)) {
          const sessionTime = parseSessionTimeToToday(sess.time);
          const diffMs = sessionTime.getTime() - now.getTime();
          const diffMins = diffMs / (1000 * 60);

          if (diffMins > -1 && diffMins <= 5) {
            setActiveAlert(sess);

            sendSystemNotification('DevFest KL 2026', {
              body: `Starting Soon: "${sess.title}" at ${sess.time} in ${sess.room}!`,
              icon: '/pwa-192x192.png',
            }).catch(() => {});

            reminded.push(sess.id);
            localStorage.setItem('devfest_reminded_sessions', JSON.stringify(reminded));
          }
        }
      });
    };

    checkUpcomingSessions();
    const timer = setInterval(checkUpcomingSessions, 10000);

    return () => clearInterval(timer);
  }, [sessions, savedSessionIds]);

  return {
    activeAlert,
    setActiveAlert,
    handleSimulateAlert,
  };
};
