import React from 'react';
import { motion } from 'framer-motion';

interface RegisterFirstTimeStepProps {
  email: string;
  profileName: string;
  setProfileName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const RegisterFirstTimeStep: React.FC<RegisterFirstTimeStepProps> = ({
  email,
  profileName,
  setProfileName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  onBack,
}) => {
  return (
    <motion.div
      key="mode-register-first-time"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18 }}
      className="w-full space-y-2.5"
    >
      {/* Ticket Verified Badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 py-1.5 px-3.5 rounded-full border border-emerald-300 w-fit mx-auto shadow-xs">
        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span>Ticket Verified: {email}</span>
      </div>

      <div className="text-center pb-1">
        <p className="text-xs text-slate-700 font-medium">
          Welcome to DevFest! Set your display name and password to get started.
        </p>
      </div>

      {/* Form: Profile Name, Password, Confirm Password */}
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

        {/* Create Password */}
        <div className="w-full h-12 bg-[#DED8CC] focus-within:bg-[#E4DFD5] focus-within:ring-2 focus-within:ring-slate-900 transition-all rounded-2xl flex items-center gap-3.5 px-5 shadow-sm border border-[#CDC6B7]">
          <span className="text-slate-700 text-xs font-mono font-bold">***</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create Password"
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

        {/* Submit Button */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="h-12 px-4 rounded-xl bg-transparent border border-slate-400 text-slate-700 text-xs font-bold hover:bg-black/5 cursor-pointer"
          >
            Back
          </button>
          <button
            type="submit"
            className="h-12 grow rounded-2xl bg-slate-950 text-white text-xs font-heading font-extrabold hover:bg-slate-800 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Continue to Profile Setup</span>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </motion.div>
  );
};
