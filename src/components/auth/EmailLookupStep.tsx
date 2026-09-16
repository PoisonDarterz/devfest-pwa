import React from 'react';
import { motion } from 'framer-motion';
import gLogo from '../../assets/g-logo.png';

interface EmailLookupStepProps {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  onGoogleSignIn: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const EmailLookupStep: React.FC<EmailLookupStepProps> = ({
  email,
  setEmail,
  isLoading,
  onGoogleSignIn,
  onSubmit,
  onBack,
}) => {
  return (
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
        onClick={onGoogleSignIn}
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
      <form onSubmit={onSubmit} className="space-y-3">
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
              className="text-slate-500 hover:text-slate-800 text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-11 px-4 rounded-xl bg-transparent border border-slate-400 text-slate-700 text-xs font-bold hover:bg-black/5 cursor-pointer"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="h-11 grow rounded-xl bg-slate-950 text-white text-xs font-heading font-extrabold hover:bg-slate-800 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? 'Checking Ticket...' : 'Continue'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
