import React from 'react';
import { motion } from 'framer-motion';
import redBowtie from '../../assets/red-bowtie.svg';
import blueGift from '../../assets/blue-gift.svg';
import greyGift from '../../assets/grey-gift.svg';
import GoogleGIcon from '../common/GoogleGIcon';
import { ArrowLeftIcon } from '../common/Icons';

export interface RewardSelection {
  id: string;
  title: string;
  subtitle: string;
}

interface RewardsModuleProps {
  claimedStamps: string[];
  onSelectReward: (reward: RewardSelection) => void;
  onBackToHome: () => void;
}

export const RewardsModule: React.FC<RewardsModuleProps> = ({
  claimedStamps,
  onSelectReward,
  onBackToHome,
}) => {
  return (
    <motion.div
      key="rewards-sheet"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col grow space-y-4 overflow-y-auto scrollbar-none pt-4 pb-2 px-1"
    >
      {/* TOP STAMP CARD CONTAINER */}
      <div className="relative w-full max-w-[320px] mx-auto pt-6">
        {/* Red Bowtie Sticker (Overlapping top center boundary) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <img src={redBowtie} alt="Red Bowtie" className="w-16 h-auto drop-shadow-md" />
        </div>

        {/* Main Stamp Card (Cream Background) */}
        <div className="bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 pt-8 shadow-2xl border-4 border-[#DED7C9] space-y-3">
          <div className="grid grid-cols-5 gap-2.5">
            {[...Array(10)].map((_, idx) => {
              const isClaimed = idx === 0 || claimedStamps.length > idx;
              return (
                <div
                  key={idx}
                  className={`h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isClaimed
                      ? 'bg-[#D8E5FD] border border-[#91B9FF] shadow-xs'
                      : 'bg-[#E2DBCF]/80 border border-black/5'
                  }`}
                >
                  <img
                    src={isClaimed ? blueGift : greyGift}
                    alt={isClaimed ? "Blue Gift" : "Grey Gift"}
                    className="w-6 h-6 object-contain"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* YOUR REWARDS SECTION */}
      <div className="space-y-3 pt-2">
        <h3 className="font-heading font-extrabold text-base text-white tracking-tight">
          Your Rewards
        </h3>

        <div className="space-y-3">
          {/* REWARD ITEM 1: 7 days Free Gemini Pro (Unlocked) */}
          <div
            onClick={() => onSelectReward({
              id: 'gemini-1',
              title: '7 days Free Gemini Pro',
              subtitle: 'Valid until 31/12/2026. First come first served basis.',
            })}
            className="bg-[#ECE6DA] text-slate-900 rounded-2xl p-4 shadow-lg border border-[#DED7C9] space-y-3 relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-xs">
                <GoogleGIcon className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 grow">
                <h4 className="font-heading font-extrabold text-sm text-slate-950 leading-tight">
                  7 days Free Gemini Pro
                </h4>
                <p className="text-[11px] italic text-slate-600 font-sans leading-tight">
                  Valid until 31/12/2026. First come first served basis.
                </p>
              </div>
            </div>

            {/* Full Green Progress Bar */}
            <div className="w-full h-1.5 bg-slate-300/60 rounded-full overflow-hidden">
              <div className="h-full bg-[#34A853] rounded-full w-full"></div>
            </div>
          </div>

          {/* REWARD ITEM 2: GDGKL Blind Box (In-Progress 2/5) */}
          <div className="bg-[#ECE6DA] text-slate-900 rounded-2xl p-4 shadow-lg border border-[#DED7C9] space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-xs">
                <GoogleGIcon className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 grow">
                <h4 className="font-heading font-extrabold text-sm text-slate-950">
                  GDGKL Blind Box
                </h4>
              </div>
            </div>

            {/* Progress Bar with 2/5 Counter */}
            <div className="flex items-center gap-3">
              <div className="grow h-1.5 bg-slate-300/60 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full w-[40%]"></div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 font-mono">2/5</span>
            </div>
          </div>

          {/* REWARD ITEM 3: 7 days Free Gemini Pro (Redeemed) */}
          <div
            onClick={() => onSelectReward({
              id: 'gemini-redeemed',
              title: '7 days Free Gemini Pro',
              subtitle: 'Valid until 31/12/2026. First come first served basis.',
            })}
            className="bg-[#ECE6DA]/80 text-slate-700 rounded-2xl p-4 shadow-sm border border-[#DED7C9] space-y-2 relative overflow-hidden opacity-90 cursor-pointer"
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-xs opacity-75">
                <GoogleGIcon className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 grow">
                <h4 className="font-heading font-extrabold text-sm text-slate-800 leading-tight">
                  7 days Free Gemini Pro
                </h4>
                <p className="text-[11px] italic text-slate-500 font-sans leading-tight">
                  Valid until 31/12/2026. First come first served basis.
                </p>
              </div>
            </div>

            {/* Repetitive REDEEMED watermark along bottom edge */}
            <div className="overflow-hidden whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-slate-400/50 select-none pointer-events-none pt-1">
              REDEEMED REDEEMED REDEEMED REDEEMED REDEEMED REDEEMED REDEEMED
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="w-full flex items-center justify-center pt-3 pb-2">
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

export default RewardsModule;
