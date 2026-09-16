import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bgIcons from '../assets/bg-icons.svg';
import GdgKlLogo from './common/GdgKlLogo';
import { ApiService } from '../services/apiService';
import { supabase } from '../lib/supabase';

// Subcomponents
import { AuthLandingStep } from './auth/AuthLandingStep';
import { EmailLookupStep } from './auth/EmailLookupStep';
import { PasswordLoginStep } from './auth/PasswordLoginStep';
import { RegisterFirstTimeStep } from './auth/RegisterFirstTimeStep';
import { RegisterEmailStep } from './auth/RegisterEmailStep';
import { RegisterGoogleStep } from './auth/RegisterGoogleStep';
import { CompleteProfileStep } from './auth/CompleteProfileStep';

export interface PendingGoogleUser {
  id?: string;
  email: string;
  name: string;
}

interface LoginPageProps {
  onLoginSuccess: (userProfile: {
    name: string;
    email: string;
    role: string;
    avatar: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  }) => void;
  initialPendingGoogleUser?: PendingGoogleUser | null;
  initialErrorMessage?: string | null;
}

type AuthMode =
  | 'login_initial'
  | 'login_email'
  | 'login_password'
  | 'register_first_time'
  | 'register_email'
  | 'register_google'
  | 'complete_profile';

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  initialPendingGoogleUser,
  initialErrorMessage,
}) => {
  const [mode, setMode] = useState<AuthMode>(
    initialPendingGoogleUser ? 'complete_profile' : 'login_initial'
  );

  // Form Fields - Credentials
  const [email, setEmail] = useState(initialPendingGoogleUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileName, setProfileName] = useState(initialPendingGoogleUser?.name || '');
  const [googleUserEmail, setGoogleUserEmail] = useState(initialPendingGoogleUser?.email || '');
  const [googleUserId, setGoogleUserId] = useState(initialPendingGoogleUser?.id || '');

  // Form Fields - Complete Profile Additional Details
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Interactive States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage || null);

  useEffect(() => {
    if (initialPendingGoogleUser) {
      setEmail(initialPendingGoogleUser.email);
      setGoogleUserEmail(initialPendingGoogleUser.email);
      setProfileName(initialPendingGoogleUser.name);
      setGoogleUserId(initialPendingGoogleUser.id || '');
      setMode('complete_profile');
    }
  }, [initialPendingGoogleUser]);

  useEffect(() => {
    if (initialErrorMessage) {
      setErrorMessage(initialErrorMessage);
    }
  }, [initialErrorMessage]);

  // 1. Google Sign In
  const handleGoogleSignIn = async (_isFromRegister = false) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Google Sign In failed.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMessage(err?.message || 'Google Sign In failed. Please try again.');
      setIsLoading(false);
    }
  };

  // 2. Email Whitelist & Profile Detection
  const handleLoginEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const status = await ApiService.checkUserStatus(email.trim());

      if (!status.isWhitelisted) {
        setErrorMessage(status.message || 'Email not found in ticketed whitelist.');
        setIsLoading(false);
        return;
      }

      if (status.hasProfile && status.profile) {
        setMode('login_password');
      } else {
        const defaultName = email
          .trim()
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        setProfileName(defaultName);
        setMode('register_first_time');
      }
    } catch (err) {
      console.error('Login email check failed:', err);
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Returning User Password Login
  const handleLoginPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await ApiService.loginUser(email.trim(), password.trim());
      if (result.success && result.user) {
        setIsLoading(false);
        try {
          localStorage.setItem('devfest_login_provider', 'email');
        } catch {}
        onLoginSuccess(result.user);
        return;
      } else {
        setIsLoading(false);
        setErrorMessage(result.message || 'Invalid email or password.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Login failed. Please try again.');
    }
  };

  // 4. First-Time Whitelisted User Account Setup
  const handleFirstTimeRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!profileName.trim()) {
      setErrorMessage('Please enter your profile name.');
      return;
    }
    if (!password) {
      setErrorMessage('Please create a password for your account.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setMode('complete_profile');
  };

  // 5. Manual Registration Link Submission
  const handleRegisterEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!profileName.trim()) {
      setErrorMessage('Please enter your profile name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const status = await ApiService.checkUserStatus(email.trim());
      if (!status.isWhitelisted) {
        setErrorMessage(status.message || 'Email is not in the ticketed whitelist.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      setMode('complete_profile');
    } catch {
      setIsLoading(false);
      setMode('complete_profile');
    }
  };

  // 6. Google SSO Details Confirmation
  const handleGoogleCompleteDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMessage('Please enter your profile name.');
      return;
    }
    setMode('complete_profile');
  };

  // 7. Final Profile Creation & Save
  const handleFinishProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const activeName = profileName.trim() || 'DevFest Attendee';
    const activeEmail = email.trim() || googleUserEmail || 'attendee@devfest.kl';
    const activeRole = role.trim() || 'Participant';
    const activeBio = bio.trim();
    const activeGithub = githubUrl.trim();
    const activeLinkedin = linkedinUrl.trim();

    try {
      const result = await ApiService.saveUserProfile({
        id: googleUserId || undefined,
        name: activeName,
        email: activeEmail,
        password: password.trim() || undefined,
        role: activeRole,
        bio: activeBio,
        githubUrl: activeGithub,
        linkedinUrl: activeLinkedin,
      });

      if (result.success && result.profile) {
        setIsLoading(false);
        try {
          localStorage.setItem('devfest_login_provider', googleUserId ? 'google' : 'email');
        } catch {}
        onLoginSuccess(result.profile);
      } else {
        setIsLoading(false);
        setErrorMessage(result.message || 'Failed to save profile.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
    }
  };

  const isCompactHeader =
    mode === 'login_email' ||
    mode === 'register_first_time' ||
    mode === 'register_email' ||
    mode === 'complete_profile';

  return (
    <div className="h-screen bg-[#ECE6DA] text-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans select-none relative">
      <div className="w-full max-w-md h-full flex flex-col relative shadow-2xl overflow-hidden bg-[#ECE6DA] justify-between p-6">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 right-0 h-[55%] overflow-hidden pointer-events-none z-0 select-none">
          <img
            src={bgIcons}
            alt=""
            className="w-full h-full object-cover object-top opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#ECE6DA]" />
        </div>

        {/* Branding Header */}
        <motion.div
          animate={{
            y: isCompactHeader ? -8 : 0,
            scale: isCompactHeader ? 0.9 : 1,
          }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex flex-col items-center justify-center text-center space-y-2 pt-3 relative z-10 shrink-0"
        >
          <div className="space-y-0.5">
            <h2 className="font-serif italic font-normal text-2xl text-slate-900 tracking-tight">
              Welcome to
            </h2>
            <div className="flex items-center justify-center gap-2">
              <h1 className="font-heading font-black text-4xl text-slate-950 tracking-tight">
                DevFest
              </h1>
              <span className="bg-[#F9AB00] text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full border border-black/15 shadow-sm">
                2026
              </span>
            </div>
          </div>

          <div className="pt-0.5 flex flex-col items-center justify-center space-y-0.5">
            <p className="text-[11px] font-medium text-slate-700">Organized by</p>
            <GdgKlLogo className="h-4.5" />
          </div>
        </motion.div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-100 border border-red-300 text-red-800 text-xs rounded-xl px-3.5 py-2 text-center font-medium shadow-xs relative z-10 my-1"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Step Views Container */}
        <div className="w-full space-y-3 pb-3 relative z-10 overflow-y-auto max-h-[64vh] scrollbar-none">
          <AnimatePresence mode="wait">
            {mode === 'login_initial' && (
              <AuthLandingStep
                isLoading={isLoading}
                onGoogleSignIn={() => handleGoogleSignIn(false)}
                onSelectEmailLogin={() => {
                  setMode('login_email');
                  setErrorMessage(null);
                }}
                onSelectRegister={() => {
                  setMode('register_email');
                  setErrorMessage(null);
                }}
              />
            )}

            {mode === 'login_email' && (
              <EmailLookupStep
                email={email}
                setEmail={setEmail}
                isLoading={isLoading}
                onGoogleSignIn={() => handleGoogleSignIn(false)}
                onSubmit={handleLoginEmailSubmit}
                onBack={() => setMode('login_initial')}
              />
            )}

            {mode === 'login_password' && (
              <PasswordLoginStep
                email={email}
                password={password}
                setPassword={setPassword}
                isLoading={isLoading}
                onSubmit={handleLoginPasswordSubmit}
                onChangeEmail={() => setMode('login_email')}
              />
            )}

            {mode === 'register_first_time' && (
              <RegisterFirstTimeStep
                email={email}
                profileName={profileName}
                setProfileName={setProfileName}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                onSubmit={handleFirstTimeRegisterSubmit}
                onBack={() => setMode('login_email')}
              />
            )}

            {mode === 'register_email' && (
              <RegisterEmailStep
                email={email}
                setEmail={setEmail}
                profileName={profileName}
                setProfileName={setProfileName}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                isLoading={isLoading}
                onGoogleSignIn={() => handleGoogleSignIn(true)}
                onSubmit={handleRegisterEmailSubmit}
                onSwitchToLogin={() => {
                  setMode('login_initial');
                  setErrorMessage(null);
                }}
              />
            )}

            {mode === 'register_google' && (
              <RegisterGoogleStep
                googleUserEmail={googleUserEmail}
                profileName={profileName}
                setProfileName={setProfileName}
                onSubmit={handleGoogleCompleteDetails}
                onBack={() => {
                  setMode('login_initial');
                  setErrorMessage(null);
                }}
              />
            )}

            {mode === 'complete_profile' && (
              <CompleteProfileStep
                email={email}
                googleUserEmail={googleUserEmail}
                profileName={profileName}
                role={role}
                setRole={setRole}
                bio={bio}
                setBio={setBio}
                githubUrl={githubUrl}
                setGithubUrl={setGithubUrl}
                linkedinUrl={linkedinUrl}
                setLinkedinUrl={setLinkedinUrl}
                isLoading={isLoading}
                onSubmit={handleFinishProfileSetup}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
