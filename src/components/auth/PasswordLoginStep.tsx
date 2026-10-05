import React from 'react';
import { motion } from 'framer-motion';
import gLogo from '../../assets/g-logo.png';

interface PasswordLoginStepProps {
  email: string;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChangeEmail: () => void;
  hasPassword?: boolean;
  onGoogleSignIn?: () => void;
}

export const PasswordLoginStep: React.FC<PasswordLoginStepProps> = ({
  email,
  password,
  setPassword,
  isLoading,
  onSubmit,
  onChangeEmail,
  hasPassword = true,
  onGoogleSignIn,
}) => {
  return (
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
          onClick={onChangeEmail}
          className="text-[10px] text-blue-600 underline font-bold ml-1 hover:text-blue-800 cursor-pointer"
        >
          Change
        </button>
      </div>

      {!hasPassword ? (
        /* Google SSO Registered Account - Prompt to sign in with Google */
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs text-center leading-relaxed font-medium">
            This account was registered using <strong>Google</strong>. Please sign in with your Google account.
          </div>

          {onGoogleSignIn && (
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={isLoading}
              className="w-full h-13 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60"
            >
              <img src={gLogo} alt="Google" className="w-5 h-5 object-contain" />
              <span className="font-heading font-extrabold text-sm text-slate-900 tracking-tight">
                {isLoading ? 'Signing In...' : 'Sign In with Google'}
              </span>
            </button>
          )}

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={onChangeEmail}
              className="text-xs text-slate-700 font-semibold underline hover:text-slate-950 cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        </div>
      ) : (
        /* Password Form */
        <form onSubmit={onSubmit} className="space-y-3">
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
              onClick={onChangeEmail}
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

          {onGoogleSignIn && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="text-xs text-slate-700 hover:text-slate-950 underline font-medium cursor-pointer"
              >
                Or sign in with Google
              </button>
            </div>
          )}
        </form>
      )}
    </motion.div>
  );
};
