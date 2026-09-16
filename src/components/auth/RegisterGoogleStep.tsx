import React from 'react';
import { motion } from 'framer-motion';
import { getAvatarUrl } from '../../lib/avatar';

interface RegisterGoogleStepProps {
  googleUserEmail: string;
  profileName: string;
  setProfileName: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const RegisterGoogleStep: React.FC<RegisterGoogleStepProps> = ({
  googleUserEmail,
  profileName,
  setProfileName,
  onSubmit,
  onBack,
}) => {
  return (
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
      <form onSubmit={onSubmit} className="space-y-4">
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
          onClick={onBack}
          className="text-xs text-slate-800 font-medium hover:text-slate-950 underline underline-offset-3 cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    </motion.div>
  );
};
