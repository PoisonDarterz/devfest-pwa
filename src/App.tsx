import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { LoginPage, type PendingGoogleUser } from './components/LoginPage';
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
}

export const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('devfest_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [pendingGoogleUser, setPendingGoogleUser] = useState<PendingGoogleUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);

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

  const handleLogout = async () => {
    setUser(null);
    setPendingGoogleUser(null);
    setAuthError(null);
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('devfest_auth_user');
      localStorage.removeItem('devfest_auth_token');
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
        handleLoginSuccess(status.profile);
      } else {
        setPendingGoogleUser({
          id: session.user.id,
          email: googleEmail,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            googleEmail.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url || '',
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
          const sessionUser = await ApiService.getCurrentUser();
          if (sessionUser && isMounted) {
            setUser(sessionUser);
          }
        } catch (err) {
          console.warn('Session restoration failed:', err);
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

    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isInitializingAuth) {
    return (
      <div className="h-screen bg-[#ECE6DA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        initialPendingGoogleUser={pendingGoogleUser}
        initialErrorMessage={authError}
      />
    );
  }

  return <HomeScreen onLogout={handleLogout} initialUser={user} />;
};

export default App;
