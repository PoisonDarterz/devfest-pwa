import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { requestNotificationPermission } from '../lib/notifications';
import { ApiService } from '../services/apiService';
import type { UserProfile } from '../services/apiService';
import type { Session, Booth, FAQItem, AppNotification } from '../lib/types';
import type { FriendConnection } from '../components/modules/FriendsModule';

interface UseConferenceDataProps {
  initialUser?: {
    name: string;
    email: string;
    role: string;
    avatar: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    ticketType?: string;
  };
  onOpenFriendsWithDetails?: (friend: FriendConnection) => void;
}

export const useConferenceData = ({
  initialUser,
  onOpenFriendsWithDetails,
}: UseConferenceDataProps) => {
  // Data States
  const [booths, setBooths] = useState<Booth[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'usr_123',
    name: initialUser?.name || 'Zixu Cheah',
    role: initialUser?.role || 'Software Engineer',
    email: initialUser?.email || 'zixu.cheah@devfest.kl',
    avatar: initialUser?.avatar || '',
    bio: initialUser?.bio || '',
    githubUrl: initialUser?.githubUrl || '',
    linkedinUrl: initialUser?.linkedinUrl || '',
    qrPayload: `DEVFEST-KL-2026-${(initialUser?.name || 'Zixu Cheah').toUpperCase().replace(/\s+/g, '-')}`,
    ticketType: initialUser?.ticketType || 'Standard Attendee',
  });

  const [discoveredFriend, setDiscoveredFriend] = useState({
    name: 'Jonas Chuan',
    role: 'Mobile Developer',
    email: 'jonas.chuan@devfest.kl',
    avatar: '',
    bio: 'Building Android apps & PWAs. Passionate about Kotlin, Flutter, and web performance!',
    githubUrl: 'https://github.com/jonaschuan',
    linkedinUrl: 'https://linkedin.com/in/jonaschuan',
  });

  const [friendsList, setFriendsList] = useState<FriendConnection[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);
  const [claimedStamps, setClaimedStamps] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('devfest_claimed_stamps');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [stampFeedback, setStampFeedback] = useState<string | null>(null);

  const [loginProvider, setLoginProvider] = useState<'google' | 'email'>(() => {
    try {
      const stored = localStorage.getItem('devfest_login_provider');
      if (stored === 'google' || stored === 'email') return stored;
    } catch {}
    return 'email';
  });

  const [savedSessionIds, setSavedSessionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('devfest_saved_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Automatically detect auth provider (Google OAuth session vs normal email/password)
  useEffect(() => {
    async function detectProvider() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const isGoogle =
          session?.user?.app_metadata?.provider === 'google' ||
          session?.user?.identities?.some((i: any) => i.provider === 'google');
        if (isGoogle) {
          setLoginProvider('google');
          localStorage.setItem('devfest_login_provider', 'google');
          return;
        }
      } catch (err) {
        console.warn('Could not check Supabase session provider:', err);
      }

      const stored = localStorage.getItem('devfest_login_provider');
      if (stored === 'google' || stored === 'email') {
        setLoginProvider(stored);
      } else {
        setLoginProvider('email');
      }
    }
    detectProvider();
  }, [userProfile.email]);

  // Load Data via Service Layer
  useEffect(() => {
    async function loadInitialData() {
      const activeEmail = initialUser?.email || userProfile.email;
      setIsFriendsLoading(true);
      const [
        fetchedSessions,
        fetchedBooths,
        fetchedFaqs,
        fetchedUser,
        fetchedSavedSessions,
        fetchedFriend,
        fetchedNotifs,
        fetchedFriends,
        fetchedStamps,
      ] = await Promise.all([
        ApiService.getSessions(),
        ApiService.getBooths(),
        ApiService.getFAQs(),
        ApiService.getUserProfile(activeEmail),
        ApiService.getSavedSessions(activeEmail),
        ApiService.getProfileById('22222222-2222-2222-2222-222222222222'),
        ApiService.getNotifications(activeEmail),
        ApiService.getFriends(activeEmail),
        ApiService.getUserStamps(activeEmail),
      ]);

      setSessions(fetchedSessions);
      setBooths(fetchedBooths);
      setFaqs(fetchedFaqs);
      if (fetchedUser) {
        setUserProfile((prev) => ({
          ...prev,
          ...fetchedUser,
          ticketType: fetchedUser.ticketType || prev.ticketType || 'Standard Attendee',
        }));
      }
      if (fetchedSavedSessions && fetchedSavedSessions.length > 0) {
        setSavedSessionIds(fetchedSavedSessions);
      }
      if (fetchedNotifs && fetchedNotifs.notifications) {
        setNotifications(fetchedNotifs.notifications);
      }
      if (fetchedFriends && fetchedFriends.length > 0) {
        setFriendsList(fetchedFriends);
      }
      if (fetchedStamps && Array.isArray(fetchedStamps.stamps)) {
        setClaimedStamps(fetchedStamps.stamps);
        try {
          localStorage.setItem('devfest_claimed_stamps', JSON.stringify(fetchedStamps.stamps));
        } catch {}
      }
      setIsFriendsLoading(false);
      if (fetchedFriend) {
        setDiscoveredFriend({
          name: fetchedFriend.name,
          role: fetchedFriend.role,
          email: fetchedFriend.email,
          avatar: fetchedFriend.avatar,
          bio: fetchedFriend.bio || 'Attendee at Google DevFest KL 2026.',
          githubUrl: fetchedFriend.githubUrl || 'https://github.com',
          linkedinUrl: fetchedFriend.linkedinUrl || 'https://linkedin.com',
        });
      }
    }
    loadInitialData();
  }, [initialUser, userProfile.email]);

  // Toggle saving/bookmarking a session with live backend persistence
  const handleToggleSaveSession = async (sessionId: string) => {
    const activeEmail = userProfile.email;
    const isSaved = savedSessionIds.includes(sessionId);

    // Optimistic UI update
    const updated = isSaved
      ? savedSessionIds.filter((id) => id !== sessionId)
      : [...savedSessionIds, sessionId];
    setSavedSessionIds(updated);

    if (!isSaved && 'Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission().catch(() => {});
    }

    try {
      const res = await ApiService.toggleSaveSession(activeEmail, sessionId);
      if (res.savedSessionIds) {
        setSavedSessionIds(res.savedSessionIds);
      }
      if (typeof res.rsvpCount === 'number') {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, rsvpCount: res.rsvpCount } : s))
        );
      }
    } catch (err) {
      console.warn('Failed to sync saved session to backend:', err);
    }
  };

  // Notification action handlers
  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await ApiService.markNotificationRead(userProfile.email, id);
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await ApiService.markAllNotificationsRead(userProfile.email);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  // Handle user profile updates from ProfileSettingsModule
  const handleUpdateProfile = async (updated: {
    name: string;
    role: string;
    bio: string;
    githubUrl: string;
    linkedinUrl: string;
  }) => {
    const res = await ApiService.updateUserProfile({
      name: updated.name,
      email: userProfile.email,
      role: updated.role,
      bio: updated.bio,
      githubUrl: updated.githubUrl,
      linkedinUrl: updated.linkedinUrl,
    });

    if (!res.success || !res.profile) {
      throw new Error(res.message || 'Failed to update profile in database.');
    }

    setUserProfile(res.profile);
    try {
      localStorage.setItem('devfest_auth_user', JSON.stringify(res.profile));
    } catch {}
  };

  // Handle connecting a new friend via QR scan or NFC bump
  const handleConnectFriend = async (identifier: string, method: 'QR Scan' | 'NFC Bump') => {
    try {
      const activeEmail = userProfile.email;
      const res = await ApiService.addFriend({
        userEmail: activeEmail,
        qrPayload: identifier,
        nfcToken: identifier,
        friendEmail: identifier.includes('@') ? identifier : undefined,
        method,
      });

      if (res.success && res.friend) {
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
          });
        } catch {}

        setFriendsList((prev) => {
          const exists = prev.some((f) => f.id === res.friend!.id);
          if (exists) {
            return prev.map((f) => (f.id === res.friend!.id ? res.friend! : f));
          }
          return [res.friend!, ...prev];
        });

        if (onOpenFriendsWithDetails) {
          onOpenFriendsWithDetails(res.friend);
        }
        return;
      }

      if (res.message) {
        setConnectionFeedback(res.message);
        setTimeout(() => setConnectionFeedback(null), 4000);
      }
    } catch (err: any) {
      console.error('Failed to add friend:', err);
      setConnectionFeedback(err?.message || 'Failed to add connection.');
      setTimeout(() => setConnectionFeedback(null), 4000);
    }
  };

  // Handle stamp claim
  const handleClaimStamp = async (boothId: string) => {
    const res = await ApiService.claimBoothStamp(boothId, userProfile.email, claimedStamps);
    if (res.stamps) {
      setClaimedStamps(res.stamps);
      try {
        localStorage.setItem('devfest_claimed_stamps', JSON.stringify(res.stamps));
      } catch {}
    }
    setStampFeedback(res.message);
    setTimeout(() => setStampFeedback(null), 3500);
    return res;
  };

  // Handle reward redeem
  const handleRedeemReward = async (rewardId: string) => {
    await ApiService.redeemReward(rewardId);
  };

  return {
    booths,
    sessions,
    setSessions,
    faqs,
    notifications,
    userProfile,
    setUserProfile,
    discoveredFriend,
    friendsList,
    setFriendsList,
    isFriendsLoading,
    connectionFeedback,
    setConnectionFeedback,
    claimedStamps,
    setClaimedStamps,
    stampFeedback,
    loginProvider,
    savedSessionIds,
    unreadNotifCount,
    handleToggleSaveSession,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleUpdateProfile,
    handleConnectFriend,
    handleClaimStamp,
    handleRedeemReward,
  };
};
