import React from 'react';
import { motion } from 'framer-motion';
import { getAvatarUrl } from '../../lib/avatar';

interface CompleteProfileStepProps {
  email: string;
  googleUserEmail: string;
  profileName: string;
  role: string;
  setRole: (role: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  githubUrl: string;
  setGithubUrl: (url: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (url: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CompleteProfileStep: React.FC<CompleteProfileStepProps> = ({
  email,
  googleUserEmail,
  profileName,
  role,
  setRole,
  bio,
  setBio,
  githubUrl,
  setGithubUrl,
  linkedinUrl,
  setLinkedinUrl,
  isLoading,
  onSubmit,
}) => {
  const avatarSeed = email || googleUserEmail || profileName;

  return (
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
            src={getAvatarUrl('', avatarSeed)}
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
      <form onSubmit={onSubmit} className="space-y-2.5">
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
            required
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
            required
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
  );
};
