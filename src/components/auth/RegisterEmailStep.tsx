import React from 'react';
import { motion } from 'framer-motion';
import gLogo from '../../assets/g-logo.png';

interface RegisterEmailStepProps {
  email: string;
  setEmail: (email: string) => void;
  profileName: string;
  setProfileName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  isLoading: boolean;
  onGoogleSignIn: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
}

export const RegisterEmailStep: React.FC<RegisterEmailStepProps> = ({
  email,
  setEmail,
  profileName,
  setProfileName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading,
  onGoogleSignIn,
  onSubmit,
  onSwitchToLogin,
}) => {
  return (
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
        onClick={onGoogleSignIn}
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
      <form onSubmit={onSubmit} className="space-y-2.5">
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
          onClick={onSwitchToLogin}
          className="text-xs text-slate-800 font-medium hover:text-slate-950 underline underline-offset-3 cursor-pointer"
        >
          Already have an account? Log in here.
        </button>
      </div>
    </motion.div>
  );
};
