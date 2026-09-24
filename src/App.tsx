import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { LoginPage, type PendingGoogleUser } from './components/LoginPage';
import { AdminScreen } from './components/admin/AdminScreen';
import { ApiService } from './services/apiService';
import { supabase } from './lib/supabase';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  avatar: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  ticketType?: string;
}

export const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('devfest_auth_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed.avatar && parsed.avatar.includes('googleusercontent.com')) {
        parsed.avatar = '';
        localStorage.setItem('devfest_auth_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [pendingGoogleUser, setPendingGoogleUser] = useState<PendingGoogleUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);

  // Dedicated Route State for /admin
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash === '#admin' ||
      window.location.search.includes('admin=true')
    );
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin=true')
      );
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
  };

  const navigateToApp = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const handleLoginSuccess = (userProfile: AuthUser) => {
    setUser(userProfile);
    setPendingGoogleUser(null);
    setAuthError(null);
    try {
      localStorage.setItem('devfest_auth_user', JSON.stringify(userProfile));
    } catch (err) {
      console.warn('Failed to persist auth user:', err);
    }
  };

  const handleLogout = async (reason?: string) => {
    setUser(null);
    setPendingGoogleUser(null);
    setAuthError(reason || null);
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('devfest_auth_user');
      localStorage.removeItem('devfest_auth_token');
      localStorage.removeItem('devfest_login_provider');
    } catch (err) {
      console.warn('Failed to clear auth user:', err);
    }
  };

  const handleOAuthUser = async (session: any) => {
    const googleEmail = session?.user?.email?.toLowerCase();
    if (!googleEmail) return;

    try {
      const status = await ApiService.checkUserStatus(googleEmail);

      // Clean OAuth hash/params from URL cleanly
      if (window.location.hash || window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (!status.isWhitelisted) {
        await supabase.auth.signOut();
        setAuthError(
          `Your Google account (${googleEmail}) is not on the ticketed whitelist. Please sign in with the email you registered on Ticket2u or Peatix.`
        );
        return;
      }

      if (status.hasProfile && status.profile) {
        // Use back normal email sign in avatar behavior (identicon generated from email/name)
        localStorage.setItem('devfest_login_provider', 'google');
        handleLoginSuccess({
          ...status.profile,
          ticketType: status.profile.ticketType || status.ticketType || 'Standard Attendee',
          avatar: '',
        });
      } else {
        setPendingGoogleUser({
          id: session.user.id,
          email: googleEmail,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            googleEmail.split('@')[0],
        });
      }
    } catch (err: any) {
      console.error('Failed to verify Google user status:', err);
      setAuthError('Could not verify ticket whitelist status. Please check your network connection.');
    }
  };

  // 1. Verify and refresh active session on app mount & listen for OAuth redirects
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // Check if there is an incoming/existing Supabase OAuth session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email && !user) {
        await handleOAuthUser(session);
      } else {
        try {
          const hadSavedSession = !!localStorage.getItem('devfest_auth_token') || !!localStorage.getItem('devfest_auth_user');
          const sessionUser = await ApiService.getCurrentUser();

          if (!sessionUser) {
            // Token was invalid, expired, or user does not exist
            if (isMounted) {
              await handleLogout(hadSavedSession ? 'Your session has expired. Please sign in again.' : undefined);
            }
          } else {
            const activeEmail = sessionUser.email;
            if (isMounted) {
              setUser(sessionUser);
            }
            if (activeEmail) {
              ApiService.getUserProfile(activeEmail).then((latest) => {
                if (latest && isMounted) {
                  setUser((prev) => {
                    const merged = { ...(prev || latest), ...latest, ticketType: latest.ticketType || prev?.ticketType || 'Standard Attendee' };
                    localStorage.setItem('devfest_auth_user', JSON.stringify(merged));
                    return merged;
                  });
                }
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.warn('Session restoration failed:', err);
          if (isMounted) {
            await handleLogout();
          }
        }
      }
      if (isMounted) {
        setIsInitializingAuth(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.email) {
        await handleOAuthUser(session);
      }
    });

    // Listen for unauthorized 401 events anywhere in the app to boot immediately
    const handleUnauthorizedEvent = () => {
      handleLogout('Your session has expired. Please sign in again.');
    };

    window.addEventListener('devfest:unauthorized', handleUnauthorizedEvent);

    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('devfest:unauthorized', handleUnauthorizedEvent);
    };
  }, []);

  if (isInitializingAuth) {
    return (
      <div className="h-screen bg-[#ECE6DA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  // 1. Dedicated PC-Centric Admin Screen Route (/admin)
  if (isAdminRoute) {
    return (
      <AdminScreen
        user={user}
        onBackToApp={navigateToApp}
        onLogout={handleLogout}
      />
    );
  }

  // 2. Attendee Login Page
  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        initialPendingGoogleUser={pendingGoogleUser}
        initialErrorMessage={authError}
      />
    );
  }

  // 3. Attendee Mobile Screen
  return (
    <HomeScreen
      onLogout={handleLogout}
      onOpenAdmin={navigateToAdmin}
      initialUser={user}
    />
  );
};

export default App;
