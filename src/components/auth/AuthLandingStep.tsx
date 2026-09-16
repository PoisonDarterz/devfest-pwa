import React from 'react';
import { motion } from 'framer-motion';
import gLogo from '../../assets/g-logo.png';

interface AuthLandingStepProps {
  isLoading: boolean;
  onGoogleSignIn: () => void;
  onSelectEmailLogin: () => void;
  onSelectRegister: () => void;
}

export const AuthLandingStep: React.FC<AuthLandingStepProps> = ({
  isLoading,
  onGoogleSignIn,
  onSelectEmailLogin,
  onSelectRegister,
}) => {
  return (
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
        onClick={onGoogleSignIn}
        disabled={isLoading}
        className="w-full h-13.5 bg-[#DED8CC] hover:bg-[#D4CDBF] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm border border-[#CDC6B7] cursor-pointer disabled:opacity-60"
      >
        <img src={gLogo} alt="Google" className="w-5 h-5 object-contain" />
        <span className="font-heading font-extrabold text-sm text-slate-900 tracking-tight">
          {isLoading ? 'Checking Ticket...' : 'Sign In with Google'}
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
        onClick={onSelectEmailLogin}
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
          onClick={onSelectRegister}
          className="text-xs text-slate-800 font-medium hover:text-slate-950 underline underline-offset-3 cursor-pointer"
        >
          Don't have an account yet? Register here.
        </button>
      </div>
    </motion.div>
  );
};
