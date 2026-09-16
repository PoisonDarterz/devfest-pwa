import React from 'react';
import gdgklLogo from '../../assets/GDGKL-logo.png';
import { getAvatarUrl } from '../../lib/avatar';
import type { UserProfile } from '../../services/apiService';

interface HomeHeaderProps {
  userProfile: UserProfile;
  unreadNotifCount: number;
  connectionFeedback: string | null;
  onDismissFeedback: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userProfile,
  unreadNotifCount,
  connectionFeedback,
  onDismissFeedback,
  onOpenNotifications,
  onOpenProfile,
}) => {
  return (
    <>
      {/* Header Bar */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <img src={gdgklLogo} alt="GDG Logo" className="h-7 w-auto object-contain shrink-0" />
          <h1 className="font-heading font-black text-2xl text-slate-950 tracking-tight">
            DevFest
          </h1>
          <span className="bg-[#F7B033] text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-black/10 shadow-sm">
            2026
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Notification Bell Button */}
          <button
            onClick={onOpenNotifications}
            className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center relative shadow-md transition-transform active:scale-95 cursor-pointer border border-white/20"
            aria-label="Notifications"
            title="Conference Notifications & Announcements"
          >
            <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-[#3B9E59] animate-pulse">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full border-2 border-emerald-900 overflow-hidden bg-slate-200 shadow-md transition-transform active:scale-95 cursor-pointer"
            aria-label="User Profile"
          >
            <img
              src={getAvatarUrl(userProfile.avatar, userProfile.email || userProfile.name)}
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Connection Toast Banner */}
      {connectionFeedback && (
        <div className="relative z-20 p-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg border border-amber-400/40 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span>🤝</span>
            <span>{connectionFeedback}</span>
          </div>
          <button
            onClick={onDismissFeedback}
            className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};
