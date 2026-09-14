import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getAvatarUrl } from '../../lib/avatar';
import type { UserProfile } from '../../services/apiService';

interface ProfileSettingsModuleProps {
  userProfile: UserProfile;
  provider: 'google' | 'email';
  onSaveProfile: (updated: {
    name: string;
    role: string;
    bio: string;
    githubUrl: string;
    linkedinUrl: string;
  }) => Promise<void>;
  onBackToHome: () => void;
}

// Preset roles for quick selection in the role dropdown
const ROLE_OPTIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Mobile Developer',
  'Backend Engineer',
  'AI / ML Engineer',
  'Cloud & DevOps Engineer',
  'UI / UX Designer',
  'Product Manager',
  'Student / Graduate',
  'Tech Lead / Architect',
  'Other',
];

export const ProfileSettingsModule: React.FC<ProfileSettingsModuleProps> = ({
  userProfile,
  provider,
  onSaveProfile,
  onBackToHome,
}) => {
  // Form field states
  const [fullName, setFullName] = useState(userProfile.name || '');
  const [role, setRole] = useState(userProfile.role || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [githubUrl, setGithubUrl] = useState(userProfile.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(userProfile.linkedinUrl || '');

  // UI state
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Full Name is required.' });
      return;
    }

    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      await onSaveProfile({
        name: fullName.trim(),
        role: role.trim(),
        bio: bio.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
      });
      setFeedbackMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        setFeedbackMessage(null);
      }, 3000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      key="profile-settings"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full w-full relative text-white"
    >
      {/* Top Drag Handle & Back Bar */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <button
          type="button"
          onClick={onBackToHome}
          className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Back to Home"
          aria-label="Back to Home"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-12 h-1 bg-neutral-600/70 rounded-full" />

        <button
          type="button"
          onClick={onBackToHome}
          className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close Profile Settings"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable Form Content */}
      <form onSubmit={handleSave} className="grow overflow-y-auto px-1 pt-2 pb-6 space-y-3.5 scrollbar-none">
        {/* ================================================================= */}
        {/* 1. HEADER SECTION: Google SSO vs Email PW                         */}
        {/* ================================================================= */}
        {provider === 'google' ? (
          <div className="flex flex-col items-center justify-center pt-2 pb-3 space-y-2 text-center">
            <p className="text-xs text-slate-300 font-sans">
              You logged in with your Google Account.
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-inner">
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-slate-600">
                <img
                  src={getAvatarUrl(userProfile.avatar, userProfile.email || 'google-user')}
                  alt="Google User"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-medium text-slate-200 truncate max-w-[200px]">
                {userProfile.email || 'user@google.com'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center pt-1 pb-3">
            {/* Playful Yellow Settings Gear Graphic */}
            <div className="relative flex items-center justify-center">
              <svg
                className="w-18 h-18 text-[#F7B033] drop-shadow-md"
                viewBox="0 0 100 100"
                fill="currentColor"
              >
                {/* 6-tooth geometric gear matching DevFest icon aesthetic */}
                <path d="M43 5h14v12.2a34 34 0 0 1 8.8 3.6l8.6-8.6 9.9 9.9-8.6 8.6c1.5 2.7 2.7 5.7 3.6 8.8H95v14H82.7a34 34 0 0 1-3.6 8.8l8.6 8.6-9.9 9.9-8.6-8.6a34 34 0 0 1-8.8 3.6V95H43V82.7a34 34 0 0 1-8.8-3.6l-8.6 8.6-9.9-9.9 8.6-8.6a34 34 0 0 1-3.6-8.8H5V43h12.2a34 34 0 0 1 3.6-8.8l-8.6-8.6 9.9-9.9 8.6 8.6a34 34 0 0 1 8.8-3.6V5zM50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30z" />
              </svg>
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {feedbackMessage && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}
          >
            {feedbackMessage.text}
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. INPUT CARD: Full Name                                          */}
        {/* ================================================================= */}
        <div className="bg-[#28292E] rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-slate-700/40 focus-within:border-slate-500 transition-colors shadow-sm">
          {/* Person User Outline Icon */}
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full bg-transparent text-white text-sm font-semibold outline-none placeholder-slate-500"
          />
        </div>

        {/* ================================================================= */}
        {/* 3. INPUT CARD: Role / Title Dropdown                              */}
        {/* ================================================================= */}
        <div className="relative">
          <div
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="bg-[#28292E] rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3 border border-slate-700/40 hover:border-slate-600 transition-colors shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3 grow min-w-0">
              {/* ID Badge Icon */}
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="7" y1="8" x2="11" y2="8" strokeLinecap="round" />
                <line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round" />
                <line x1="7" y1="16" x2="13" y2="16" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Role / Title"
                className="w-full bg-transparent text-white text-sm font-semibold outline-none placeholder-slate-500"
              />
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Toggle role choices"
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Preset Roles Dropdown Menu */}
          {isRoleDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 max-h-48 overflow-y-auto">
              {ROLE_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRole(item);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    role === item ? 'bg-blue-600/30 text-blue-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{item}</span>
                  {role === item && <span className="text-blue-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 4. INPUT CARD: Short Bio Textarea                                 */}
        {/* ================================================================= */}
        <div className="bg-[#28292E] rounded-2xl px-4 py-3.5 flex items-start gap-3 border border-slate-700/40 focus-within:border-slate-500 transition-colors shadow-sm">
          {/* 3-line hamburger/align icon */}
          <svg className="w-5 h-5 text-slate-400 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h12" />
          </svg>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short bio"
            className="w-full bg-transparent text-white text-sm outline-none placeholder-slate-500 resize-none font-normal leading-relaxed"
          />
        </div>

        {/* ================================================================= */}
        {/* 5. INPUT CARD: GitHub Profile URL                                 */}
        {/* ================================================================= */}
        <div className="bg-[#28292E] rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-slate-700/40 focus-within:border-slate-500 transition-colors shadow-sm">
          {/* GitHub Icon */}
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="GitHub Profile URL"
            className="w-full bg-transparent text-white text-sm outline-none placeholder-slate-500"
          />
        </div>

        {/* ================================================================= */}
        {/* 6. INPUT CARD: LinkedIn Profile URL                               */}
        {/* ================================================================= */}
        <div className="bg-[#28292E] rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-slate-700/40 focus-within:border-slate-500 transition-colors shadow-sm">
          {/* LinkedIn Icon */}
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
          </svg>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="LinkedIn Profile URL"
            className="w-full bg-transparent text-white text-sm outline-none placeholder-slate-500"
          />
        </div>

        {/* ================================================================= */}
        {/* 7. ACTION BUTTON: Save Changes Pill Button                        */}
        {/* ================================================================= */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 px-6 rounded-full bg-[#EAE4D9] text-[#1C1D21] font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-[#DFD8CC] transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-4 h-4 text-[#1C1D21]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                {/* Bold Checkmark Icon */}
                <svg className="w-5 h-5 text-[#1C1D21]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ProfileSettingsModule;
