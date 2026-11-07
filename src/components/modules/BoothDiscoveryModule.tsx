import React from 'react';
import { motion } from 'framer-motion';
import yellowStar from '../../assets/yellow-star.svg';
import redHeart from '../../assets/red-heart.svg';
import bluePlus from '../../assets/blue-plus.svg';
import GdgKlLogo from '../common/GdgKlLogo';
import { GiftIcon, ArrowLeftIcon } from '../common/Icons';
import type { Booth } from '../../lib/types';

interface BoothDiscoveryModuleProps {
  booth: Booth;
  claimedStamps: string[];
  onBackToHome: () => void;
}

export const BoothDiscoveryModule: React.FC<BoothDiscoveryModuleProps> = ({
  booth,
  claimedStamps,
  onBackToHome,
}) => {
  return (
    <motion.div
      key="booth-profile"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col items-center justify-between grow space-y-4 overflow-y-auto scrollbar-none pt-12 pb-1"
    >
      <div className="relative w-full max-w-[280px] pt-4 my-auto">
        <div className="absolute -top-3 -left-3 z-20 pointer-events-none transform -rotate-12">
          <img src={yellowStar} alt="Yellow Star" className="w-13 h-13 drop-shadow-lg" />
        </div>
        <div className="absolute -top-4 -right-3 z-20 pointer-events-none transform rotate-12">
          <img src={redHeart} alt="Red Heart" className="w-13 h-13 drop-shadow-lg" />
        </div>
        <div className="absolute -bottom-4 -right-3 z-20 pointer-events-none transform rotate-6">
          <img src={bluePlus} alt="Blue Plus" className="w-13 h-13 drop-shadow-lg" />
        </div>

        {/* Main Discovery Card */}
        <div className="relative bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 shadow-2xl border-4 border-[#DED7C9] text-center space-y-3.5">
          <div className="space-y-0.5 pt-1">
            <h2 className="font-heading font-bold text-2xl text-slate-950 tracking-tight">
              New discovery!
            </h2>
            <p className="text-xs italic text-slate-600 font-serif">
              You visited a booth.
            </p>
          </div>

          <div className="py-2.5 px-4 bg-white/60 rounded-2xl border border-slate-200/80 inline-block min-w-[170px]">
            <div className="font-heading font-black text-2xl text-slate-950 tracking-tighter">
              {booth.logoText ? booth.logoText : booth.name}
            </div>
            {booth.location && (
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                {booth.location}
              </p>
            )}
          </div>

          <div className="space-y-0.5">
            <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight">
              {booth.name}
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              {booth.category}
            </p>
          </div>

          {/* Stamp Card Passport Grid (4 Partner + 1 Game Booth) */}
          <div className="p-3 bg-white/40 rounded-2xl border border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 px-0.5">
              <div className="flex items-center gap-1">
                <span>Stamp Passport</span>
                <span
                  title="Collect 4 partner stamps to unlock the Nanobanana Game Booth!"
                  className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-serif font-bold italic"
                >
                  i
                </span>
              </div>
              <span className="font-bold text-slate-800">
                {Math.min(claimedStamps.filter((s) => !s.toLowerCase().includes('nanobanana')).length, 4)}/4 Partner • {claimedStamps.some((s) => s.toLowerCase().includes('nanobanana')) ? 'Game ✓' : 'Game 🔒'}
              </span>
            </div>

            {/* 4 Partner Stamps + 1 Game Booth Stamp */}
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 1, 2, 3].map((idx) => {
                const regularCount = claimedStamps.filter((s) => !s.toLowerCase().includes('nanobanana')).length;
                const isAwarded = regularCount > idx;
                return (
                  <div
                    key={idx}
                    title={`Partner Booth Stamp #${idx + 1}`}
                    className={`h-9 rounded-xl flex items-center justify-center shadow-xs transition-transform ${
                      isAwarded
                        ? 'bg-[#91B9FF] text-blue-900 border border-blue-400 scale-105'
                        : 'bg-[#E2DBCF] text-slate-400 border border-slate-300/60'
                    }`}
                  >
                    <GiftIcon />
                  </div>
                );
              })}

              {/* Game Booth Stamp */}
              {(() => {
                const regularCount = claimedStamps.filter((s) => !s.toLowerCase().includes('nanobanana')).length;
                const hasGame = claimedStamps.some((s) => s.toLowerCase().includes('nanobanana'));
                const isGameUnlocked = regularCount >= 4;
                return (
                  <div
                    title={hasGame ? 'Nanobanana Game Stamp Collected!' : isGameUnlocked ? 'Game Booth Unlocked!' : 'Game Booth (Locked until 4 partner stamps)'}
                    className={`h-9 rounded-xl flex items-center justify-center shadow-xs transition-transform text-sm relative ${
                      hasGame
                        ? 'bg-amber-300 text-amber-950 border border-amber-500 scale-105 font-bold'
                        : isGameUnlocked
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-400 animate-pulse'
                        : 'bg-[#DCD5C7] text-slate-400 border border-slate-300'
                    }`}
                  >
                    {hasGame ? '🎮' : isGameUnlocked ? '🎮' : '🔒'}
                  </div>
                );
              })()}
            </div>

            <p className="text-[10px] text-slate-500 italic font-serif">
              {claimedStamps.filter((s) => !s.toLowerCase().includes('nanobanana')).length < 4
                ? `Collect ${4 - claimedStamps.filter((s) => !s.toLowerCase().includes('nanobanana')).length} more partner stamp${4 - claimedStamps.filter((s) => !s.toLowerCase().includes('nanobanana')).length > 1 ? 's' : ''} to unlock Game Booth.`
                : !claimedStamps.some((s) => s.toLowerCase().includes('nanobanana'))
                ? 'Game Booth is unlocked! Visit Hall B - #03 for final stamp.'
                : 'All stamps collected! Blind box reward unlocked! 🎁'}
            </p>
          </div>

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

export default BoothDiscoveryModule;
