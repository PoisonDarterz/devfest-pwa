import React from 'react';
import { motion } from 'framer-motion';
import pinkFlower from '../../assets/pink-flower.svg';
import bluePlus from '../../assets/blue-plus.svg';
import redHeart from '../../assets/red-heart.svg';
import { getAvatarUrl } from '../../lib/avatar';
import GdgKlLogo from '../common/GdgKlLogo';
import { ArrowLeftIcon } from '../common/Icons';

interface FriendDiscoveryModuleProps {
  friend: {
    name: string;
    role: string;
    avatar: string;
    company?: string;
    email?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  };
  onBackToHome: () => void;
}

const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const FriendDiscoveryModule: React.FC<FriendDiscoveryModuleProps> = ({
  friend,
  onBackToHome,
}) => {
  return (
    <motion.div
      key="participant-profile"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col items-center justify-between grow space-y-4 overflow-y-auto scrollbar-none pt-12 pb-1"
    >
      <div className="relative w-full max-w-[290px] pt-4 my-auto">
        <div className="absolute -top-3 -left-3 z-20 pointer-events-none transform -rotate-12">
          <img src={pinkFlower} alt="Pink Flower" className="w-13 h-13 drop-shadow-lg" />
        </div>
        <div className="absolute -top-4 -right-3 z-20 pointer-events-none transform rotate-12">
          <img src={redHeart} alt="Red Heart" className="w-13 h-13 drop-shadow-lg" />
        </div>
        <div className="absolute -bottom-4 -right-3 z-20 pointer-events-none transform rotate-6">
          <img src={bluePlus} alt="Blue Plus" className="w-13 h-13 drop-shadow-lg" />
        </div>

        {/* Main Discovery Card */}
        <div className="relative bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 shadow-2xl border-4 border-[#DED7C9] text-center space-y-3.5">
          <div className="space-y-0.5">
            <h2 className="font-heading font-bold text-xl text-slate-950 tracking-tight">
              New connection!
            </h2>
            <p className="text-[9px] uppercase font-mono tracking-wider text-emerald-700 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full inline-block">
              DevFest attendee
            </p>
          </div>

          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-slate-800 shadow-md bg-white flex items-center justify-center">
            <img
              src={getAvatarUrl(friend.avatar, friend.name)}
              alt={friend.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-0.5">
            <h3 className="font-heading font-extrabold text-xl text-slate-950 tracking-tight leading-tight">
              {friend.name}
            </h3>
            <p className="text-xs font-bold text-slate-700">
              {friend.role} {friend.company ? `at ${friend.company}` : ''}
            </p>
          </div>

          {friend.bio && (
            <div className="text-[10.5px] text-slate-600 leading-relaxed font-normal italic bg-slate-100/60 p-3 rounded-2xl border border-slate-200/50 max-h-[85px] overflow-y-auto scrollbar-none">
              "{friend.bio}"
            </div>
          )}

          {(friend.email || friend.githubUrl || friend.linkedinUrl) && (
            <div className="pt-2.5 border-t border-slate-300/60 flex flex-col items-center gap-2">
              {friend.email && (
                <div className="flex items-center gap-1.5 text-[9.5px] text-slate-600 font-mono">
                  <EmailIcon />
                  <span>{friend.email}</span>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2.5 mt-0.5">
                {friend.githubUrl && (
                  <a
                    href={friend.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow transition-all active:scale-90"
                    aria-label="GitHub Profile"
                  >
                    <GithubIcon />
                  </a>
                )}
                {friend.linkedinUrl && (
                  <a
                    href={friend.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white flex items-center justify-center shadow transition-all active:scale-90"
                    aria-label="LinkedIn Profile"
                  >
                    <LinkedinIcon />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300/60">
            <GdgKlLogo />
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-center pt-2 pb-2">
        <button
          onClick={onBackToHome}
          className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          aria-label="Back to Home"
        >
          <ArrowLeftIcon />
        </button>
      </div>
    </motion.div>
  );
};

export default FriendDiscoveryModule;
