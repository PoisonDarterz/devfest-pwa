import React, { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { LoginPage } from './components/LoginPage';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  avatar: string;
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

  const handleLoginSuccess = (userProfile: AuthUser) => {
    setUser(userProfile);
    try {
      localStorage.setItem('devfest_auth_user', JSON.stringify(userProfile));
    } catch (err) {
      console.warn('Failed to persist auth user:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('devfest_auth_user');
    } catch (err) {
      console.warn('Failed to clear auth user:', err);
    }
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <HomeScreen onLogout={handleLogout} initialUser={user} />;
};

export default App;
