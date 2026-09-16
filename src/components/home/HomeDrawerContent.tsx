import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pinkFlower from '../../assets/pink-flower.svg';
import yellowArrow from '../../assets/yellow-arrow.svg';
import greenHashtag from '../../assets/green-hashtag.svg';
import { GiftIcon, HelpIcon } from '../common/Icons';
import type { Session } from '../../lib/types';

interface HomeDrawerContentProps {
  activeUpcomingSession: Session | null;
  onSelectUpcomingSession: (session: Session) => void;
  onOpenFriends: () => void;
  onOpenRewards: () => void;
  onOpenFaq: () => void;
}

export const HomeDrawerContent: React.FC<HomeDrawerContentProps> = ({
  activeUpcomingSession,
  onSelectUpcomingSession,
  onOpenFriends,
  onOpenRewards,
  onOpenFaq,
}) => {
  return (
    <motion.div
      key="home-sheet"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18 }}
      className="space-y-5 overflow-y-auto overscroll-contain scrollbar-none grow flex flex-col justify-between"
    >
      {activeUpcomingSession && (
        <div
          onClick={() => onSelectUpcomingSession(activeUpcomingSession)}
          className="relative bg-[#273C70] rounded-2xl p-5 overflow-hidden shadow-xl border border-blue-900/50 cursor-pointer hover:border-blue-500/50 transition-all active:scale-[0.99] shrink-0 min-h-[120px]"
        >
          <div className="absolute -top-3 -right-3 z-20 pointer-events-none transform rotate-12">
            <img src={pinkFlower} alt="" className="w-14 h-14 drop-shadow-lg" />
          </div>
          <div className="absolute -bottom-3 -left-3 z-20 pointer-events-none transform -rotate-12">
            <img src={yellowArrow} alt="" className="w-16 h-16 drop-shadow-lg" />
          </div>
          <div className="absolute -bottom-3 -right-3 z-20 pointer-events-none transform rotate-6">
            <img src={greenHashtag} alt="" className="w-14 h-14 drop-shadow-lg" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeUpcomingSession.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="relative z-10 space-y-3 pr-6"
            >
              <div className="flex items-start gap-3">
                <img
                  src={activeUpcomingSession.speaker.avatar}
                  alt=""
                  className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/20 shadow-md"
                />
                <div className="space-y-1 grow">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80 font-mono italic">
                      UPCOMING SESSION ({activeUpcomingSession.time})
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-white leading-snug">
                    {activeUpcomingSession.title}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-blue-100/90 leading-relaxed font-normal">
                {activeUpcomingSession.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Met Someone New Row */}
      <div
        onClick={onOpenFriends}
        className="pt-2 pb-2 border-b border-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 rounded-xl px-2 transition-colors -mx-2"
      >
        <div>
          <h3 className="font-serif italic font-normal text-xl text-white tracking-tight">
            Met Someone New?
          </h3>
          <p className="text-xs text-slate-400 font-sans">Add them as a friend here</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>

      {/* Two Circular/Pill Bottom Action Buttons */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none shrink-0 pt-2">
        <button
          onClick={onOpenRewards}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#EAE4D9] text-[#1C1D21] font-bold text-xs shadow-lg hover:scale-105 transition-transform shrink-0 active:scale-95 cursor-pointer"
        >
          <GiftIcon />
          <span>Rewards</span>
        </button>

        <button
          onClick={onOpenFaq}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#EAE4D9] text-[#1C1D21] font-bold text-xs shadow-lg hover:scale-105 transition-transform shrink-0 active:scale-95 cursor-pointer"
        >
          <HelpIcon />
          <span>FAQ & Info</span>
        </button>
      </div>
    </motion.div>
  );
};
