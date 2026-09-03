import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bgIcons from '../assets/bg-icons.svg';
import gLogo from '../assets/g-logo.png';
import GdgKlLogo from './common/GdgKlLogo';
import { getAvatarUrl } from '../lib/avatar';
import { ApiService } from '../services/apiService';

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
}

type AuthMode =
  | 'login_initial'
  | 'login_email'
  | 'login_password'
  | 'register_email'
  | 'register_google'
  | 'complete_profile';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login_initial');

  // Form Fields - Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileName, setProfileName] = useState('');
  const [googleUserEmail, setGoogleUserEmail] = useState('zixu.cheah@devfest.kl');

  // Form Fields - Complete Profile Additional Details
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Interactive States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Google Sign In
  const handleGoogleSignIn = (isFromRegister = false) => {
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      if (isFromRegister) {
        const activeEmail = email.trim() || 'zixu.cheah@devfest.kl';
        setGoogleUserEmail(activeEmail);
        setProfileName('Zixu Cheah');
        setMode('register_google');
      } else {
        onLoginSuccess({
          name: 'Zixu Cheah',
          email: 'zixu.cheah@devfest.kl',
          role: 'Software Engineer',
          avatar: '',
        });
      }
    }, 500);
  };

  // Handle Login Email Step
  const handleLoginEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const whitelistResult = await ApiService.validateEmailWhitelist(email.trim());
      if (whitelistResult.isWhitelisted) {
        setMode('login_password');
      } else {
        setErrorMessage(whitelistResult.message || 'Email not found in ticketed whitelist.');
      }
    } catch {
      setMode('login_password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login Password Step
  const handleLoginPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      const username = email.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = username
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      onLoginSuccess({
        name: formattedName || 'DevFest Attendee',
        email: email.trim(),
        role: 'Participant',
        avatar: '',
      });
    }, 600);
  };

  // Handle Registration with Email & Password -> Advance to Complete Profile
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
      const whitelistResult = await ApiService.validateEmailWhitelist(email.trim());
      if (!whitelistResult.isWhitelisted) {
        setErrorMessage(whitelistResult.message || 'Email is not in the ticketed whitelist.');
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

  // Handle Google SSO step -> Advance to Complete Profile
  const handleGoogleCompleteDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMessage('Please enter your profile name.');
      return;
    }
    setMode('complete_profile');
  };

  // Final Complete Profile Submission (saves role, bio, githubUrl, linkedinUrl)
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
        name: activeName,
        email: activeEmail,
        role: activeRole,
        bio: activeBio,
        githubUrl: activeGithub,
        linkedinUrl: activeLinkedin,
        avatar: '',
      });

      setIsLoading(false);
      onLoginSuccess(result.profile);
    } catch {
      setIsLoading(false);
      onLoginSuccess({
        name: activeName,
        email: activeEmail,
        role: activeRole,
        bio: activeBio,
        githubUrl: activeGithub,
        linkedinUrl: activeLinkedin,
        avatar: '',
      });
    }
  };

  const isCompactHeader = mode === 'login_email' || mode === 'register_email' || mode === 'complete_profile';

  return (
    <div className="h-screen bg-[#ECE6DA] text-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans select-none relative">
      <div className="w-full max-w-md h-full flex flex-col relative shadow-2xl overflow-hidden bg-[#ECE6DA] justify-between p-6">
        
        {/* BACKGROUND DECORATION SVG (TOP HALF ONLY) */}
        <div className="absolute top-0 left-0 right-0 h-[55%] overflow-hidden pointer-events-none z-0 select-none">
          <img
            src={bgIcons}
            alt=""
            className="w-full h-full object-cover object-top opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#ECE6DA]" />
        </div>

        {/* BRANDING HEADER CONTAINER */}
        <motion.div
          animate={{
            y: isCompactHeader ? -8 : 0,
            scale: isCompactHeader ? 0.90 : 1,
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

        {/* ERROR FEEDBACK BANNER */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-100 border border-red-300 text-red-800 text-xs rounded-xl px-3.5 py-2 text-center font-medium shadow-xs relative z-10 my-1"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* INTERACTIVE ACTIONS CONTAINER */}
        <div className="w-full space-y-3 pb-3 relative z-10 overflow-y-auto max-h-[64vh] scrollbar-none">
          <AnimatePresence mode="wait">
            
            {/* ------------------------------------------------------------- */}
            {/* 1. LOGIN - INITIAL STATE */}
            {/* ------------------------------------------------------------- */}
            {mode === 'login_initial' && (
              <motion.div
                key="mode-login-initial"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="w-full space-y-3"
              >
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(false)}
                  disabled={isLoading}
                  className="w-full h-13.5 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60"
                >
                  <img src={gLogo} alt="Google" className="w-5 h-5 object-contain" />
                  <span className="font-heading font-extrabold text-sm text-slate-900 tracking-tight">
                    {isLoading ? 'Signing In...' : 'Sign In with Google'}
                  </span>
                </button>

                {/* OR Divider */}
                <div className="text-center">
                  <span className="text-xs font-serif italic text-slate-600 font-medium tracking-wide">
                    OR
                  </span>
                </div>

                {/* Email Address Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login_email');
                    setErrorMessage(null);
                  }}
                  className="w-full h-13.5 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7] cursor-pointer text-left text-slate-600"
                >
                  <svg className="w-5 h-5 text-slate-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">
                    Email Address
                  </span>
                </button>

                {/* Switch to Register Link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register_email');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-800 font-medium hover:text-slate-950 underline underline-offset-3 cursor-pointer"
                  >
                    Don't have an account yet? Register here.
                  </button>
                </div>
              </motion.div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. LOGIN - EMAIL FOCUSED STATE */}
            {/* ------------------------------------------------------------- */}
            {mode === 'login_email' && (
              <motion.div
                key="mode-login-email"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="w-full space-y-3"
              >
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(false)}
                  disabled={isLoading}
                  className="w-full h-13.5 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60"
                >
                  <img src={gLogo} alt="Google" className="w-5 h-5 object-contain" />
                  <span className="font-heading font-extrabold text-sm text-slate-900 tracking-tight">
                    Sign In with Google
                  </span>
                </button>

                {/* OR Divider */}
                <div className="text-center">
                  <span className="text-xs font-serif italic text-slate-600 font-medium tracking-wide">
                    OR
                  </span>
                </div>

                {/* Interactive Email Form */}
                <form onSubmit={handleLoginEmailSubmit} className="space-y-3">
                  <div className="w-full h-13.5 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <svg className="w-5 h-5 text-slate-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      autoFocus
                      required
                      className="bg-transparent border-none outline-hidden text-sm font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                    {email && (
                      <button
                        type="button"
                        onClick={() => setEmail('')}
                        className="text-slate-500 hover:text-slate-800 text-xs p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('login_initial')}
                      className="h-11 px-4 rounded-xl bg-transparent border border-slate-400 text-slate-700 text-xs font-bold hover:bg-black/5 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="h-11 grow rounded-xl bg-slate-950 text-white text-xs font-heading font-extrabold hover:bg-slate-800 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Checking Whitelist...' : 'Continue'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. LOGIN - PASSWORD CONFIRMED STATE */}
            {/* ------------------------------------------------------------- */}
            {mode === 'login_password' && (
              <motion.div
                key="mode-login-password"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="w-full space-y-3"
              >
                {/* Confirmed Email Pill */}
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-800 bg-[#E0DACF] py-2 px-4 rounded-full border border-[#CDC6B7] w-fit mx-auto">
                  <svg className="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => setMode('login_email')}
                    className="text-[10px] text-blue-600 underline font-bold ml-1 hover:text-blue-800 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Password Form */}
                <form onSubmit={handleLoginPasswordSubmit} className="space-y-3">
                  <div className="w-full h-13.5 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <span className="text-slate-700 text-xs font-mono font-bold">***</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      autoFocus
                      required
                      className="bg-transparent border-none outline-hidden text-sm font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('login_email')}
                      className="h-11 px-4 rounded-xl bg-transparent border border-slate-400 text-slate-700 text-xs font-bold hover:bg-black/5 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="h-11 grow rounded-xl bg-slate-950 text-white text-xs font-heading font-extrabold hover:bg-slate-800 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. REGISTRATION - EMAIL & PASSWORD STATE (Screen 1) */}
            {/* ------------------------------------------------------------- */}
            {mode === 'register_email' && (
              <motion.div
                key="mode-register-email"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="w-full space-y-2.5"
              >
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(true)}
                  disabled={isLoading}
                  className="w-full h-12 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60"
                >
                  <img src={gLogo} alt="Google" className="w-5 h-5 object-contain" />
                  <span className="font-heading font-extrabold text-sm text-slate-900 tracking-tight">
                    Sign In with Google
                  </span>
                </button>

                {/* OR Divider */}
                <div className="text-center py-0.5">
                  <span className="text-xs font-serif italic text-slate-600 font-medium tracking-wide">
                    OR
                  </span>
                </div>

                {/* Form Fields: Profile Name, Email, Password, Confirm Password */}
                <form onSubmit={handleRegisterEmailSubmit} className="space-y-2.5">
                  {/* Profile Name */}
                  <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <svg className="w-4.5 h-4.5 text-slate-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Profile Name"
                      required
                      className="bg-transparent border-none outline-hidden text-sm font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <svg className="w-4.5 h-4.5 text-slate-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      className="bg-transparent border-none outline-hidden text-sm font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* Password */}
                  <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <span className="text-slate-700 text-xs font-mono font-bold">***</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="bg-transparent border-none outline-hidden text-sm font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <span className="text-slate-700 text-xs font-mono font-bold">***</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      required
                      className="bg-transparent border-none outline-hidden text-sm font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* Create Account Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-2.5 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60 mt-1"
                  >
                    <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-heading font-extrabold text-sm text-slate-950 tracking-tight">
                      {isLoading ? 'Checking Whitelist...' : 'Create Account'}
                    </span>
                  </button>
                </form>

                {/* Switch to Login Link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login_initial');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-800 font-medium hover:text-slate-950 underline underline-offset-3 cursor-pointer"
                  >
                    Already have an account? Log in here.
                  </button>
                </div>
              </motion.div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. REGISTRATION - GOOGLE SSO STATE (Screen 2) */}
            {/* ------------------------------------------------------------- */}
            {mode === 'register_google' && (
              <motion.div
                key="mode-register-google"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="w-full space-y-4 pt-2"
              >
                {/* Google Account Info Box */}
                <div className="text-center space-y-2">
                  <p className="text-xs font-medium text-slate-700">
                    You logged in with your Google Account.
                  </p>
                  <div className="flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-900 bg-[#E0DACF] py-2 px-4 rounded-full border border-[#CDC6B7] w-fit mx-auto shadow-xs">
                    <img
                      src={getAvatarUrl('', googleUserEmail)}
                      alt="Google Account"
                      className="w-5 h-5 rounded-full object-cover border border-slate-400"
                    />
                    <span>{googleUserEmail}</span>
                  </div>
                </div>

                {/* Editable Profile Name Form */}
                <form onSubmit={handleGoogleCompleteDetails} className="space-y-4">
                  <div className="w-full h-14 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <svg className="w-5 h-5 text-slate-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Profile Name"
                      required
                      autoFocus
                      className="bg-transparent border-none outline-hidden text-sm font-semibold text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* Complete Details Submit Button */}
                  <button
                    type="submit"
                    className="w-full h-14 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-2.5 shadow-sm border border-[#CDC6B7] cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-heading font-extrabold text-sm text-slate-950 tracking-tight">
                      Complete Details
                    </span>
                  </button>
                </form>

                {/* Switch to Login / Change method */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login_initial');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-800 font-medium hover:text-slate-950 underline underline-offset-3 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. COMPLETE YOUR PROFILE ONBOARDING STATE */}
            {/* ------------------------------------------------------------- */}
            {mode === 'complete_profile' && (
              <motion.div
                key="mode-complete-profile"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="w-full space-y-3 pt-1"
              >
                {/* Profile Avatar & Header Title */}
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-full overflow-hidden mx-auto border-2 border-slate-700 bg-slate-200 shadow-sm">
                    <img
                      src={getAvatarUrl('', email || googleUserEmail || profileName)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-slate-950">
                      Complete Your Profile
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Connect with attendees via NFC & QR by adding your details.
                    </p>
                  </div>
                </div>

                {/* Additional Details Form */}
                <form onSubmit={handleFinishProfileSetup} className="space-y-2.5">
                  {/* Role / Title */}
                  <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <svg className="w-4.5 h-4.5 text-slate-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Role / Title (e.g. Student, AI Engineer)"
                      autoFocus
                      className="bg-transparent border-none outline-hidden text-xs font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* Short Bio */}
                  <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <svg className="w-4.5 h-4.5 text-slate-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Short Bio (e.g. Building PWAs & ML models)"
                      className="bg-transparent border-none outline-hidden text-xs font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* GitHub URL */}
                  <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <svg className="w-4.5 h-4.5 text-slate-700 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="GitHub URL (https://github.com/username)"
                      className="bg-transparent border-none outline-hidden text-xs font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* LinkedIn URL */}
                  <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
                    <svg className="w-4.5 h-4.5 text-slate-700 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
                    </svg>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="LinkedIn URL (https://linkedin.com/in/username)"
                      className="bg-transparent border-none outline-hidden text-xs font-medium text-slate-950 placeholder:text-slate-600 grow"
                    />
                  </div>

                  {/* Complete Setup Action Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-2.5 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60 mt-2"
                  >
                    <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-heading font-extrabold text-sm text-slate-950 tracking-tight">
                      {isLoading ? 'Saving Profile...' : 'Finish Setup & Enter DevFest'}
                    </span>
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
