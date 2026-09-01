import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bgIcons from '../assets/bg-icons.svg';
import gLogo from '../assets/g-logo.png';
import GdgKlLogo from './common/GdgKlLogo';
import { ApiService } from '../services/apiService';

interface LoginPageProps {
  onLoginSuccess: (userProfile: {
    name: string;
    email: string;
    role: string;
    avatar: string;
  }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'initial' | 'email' | 'password'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Demo Google Sign In / Supabase OAuth integration
      setTimeout(() => {
        onLoginSuccess({
          name: 'Zixu Cheah',
          email: 'zixu.cheah@devfest.kl',
          role: 'Software Engineer',
          avatar: '',
        });
        setIsLoading(false);
      }, 600);
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to sign in with Google. Please try again.');
    }
  };

  // Handle Email submission to advance to password step
  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        setStep('password');
      } else {
        setErrorMessage(whitelistResult.message || 'Email not found in ticketed whitelist.');
      }
    } catch {
      setStep('password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle final Password / Sign In submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
    }, 700);
  };

  return (
    <div className="h-screen bg-[#ECE6DA] text-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans select-none relative">
      <div className="w-full max-w-md h-full flex flex-col relative shadow-2xl overflow-hidden bg-[#ECE6DA] justify-between p-6">
        
        {/* BACKGROUND DECORATION SVG (TOP HALF ONLY) */}
        <div className="absolute top-0 left-0 right-0 h-[55%] overflow-hidden pointer-events-none z-0 select-none">
          <img
            src={bgIcons}
            alt=""
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#ECE6DA]" />
        </div>

        {/* BRANDING HEADER CONTAINER */}
        <motion.div
          animate={{
            y: step === 'initial' ? 0 : -10,
            scale: step === 'initial' ? 1 : 0.95,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex flex-col items-center justify-center text-center space-y-3 pt-6 relative z-10"
        >
          <div className="space-y-1">
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

          <div className="pt-2 flex flex-col items-center justify-center space-y-1">
            <p className="text-[11px] font-medium text-slate-700">Organized by</p>
            <GdgKlLogo className="h-5" />
          </div>
        </motion.div>

        {/* ERROR FEEDBACK BANNER */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-100 border border-red-300 text-red-800 text-xs rounded-xl px-3.5 py-2 text-center font-medium shadow-xs relative z-10"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* INTERACTIVE LOGIN ACTIONS CONTAINER */}
        <div className="w-full space-y-3.5 pb-6 relative z-10">
          <AnimatePresence mode="wait">
            
            {/* 1. INITIAL STEP: Sign in with Google + Email trigger */}
            {step === 'initial' && (
              <motion.div
                key="step-initial"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-3.5"
              >
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-14 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60"
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
                    setStep('email');
                    setErrorMessage(null);
                  }}
                  className="w-full h-14 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7] cursor-pointer text-left text-slate-600"
                >
                  <svg className="w-5 h-5 text-slate-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">
                    Email Address
                  </span>
                </button>

                {/* Register Link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('zixu.cheah@devfest.kl');
                      setStep('email');
                    }}
                    className="text-xs text-slate-800 font-medium hover:text-slate-950 underline underline-offset-3 cursor-pointer"
                  >
                    Don't have an account yet? Register here.
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. EMAIL INPUT STEP */}
            {step === 'email' && (
              <motion.div
                key="step-email"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-3.5"
              >
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-14 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60"
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
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div className="w-full h-14 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
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
                      onClick={() => setStep('initial')}
                      className="h-11 px-4 rounded-xl bg-transparent border border-slate-400 text-slate-700 text-xs font-bold hover:bg-black/5"
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

            {/* 3. CONFIRMED EMAIL WITH PASSWORD STEP */}
            {step === 'password' && (
              <motion.div
                key="step-password"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-3.5"
              >
                {/* Confirmed Email Pill */}
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-800 bg-[#E0DACF] py-2 px-4 rounded-full border border-[#CDC6B7] w-fit mx-auto">
                  <svg className="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-[10px] text-blue-600 underline font-bold ml-1 hover:text-blue-800 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Password Form */}
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div className="w-full h-14 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
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
                      onClick={() => setStep('email')}
                      className="h-11 px-4 rounded-xl bg-transparent border border-slate-400 text-slate-700 text-xs font-bold hover:bg-black/5"
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

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
