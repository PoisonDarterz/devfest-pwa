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
            <div className="font-heading font-black text-3xl text-slate-950 tracking-tighter">
              42<span className="text-[#3B72EF]">KL</span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Kuala Lumpur | Sunway Education Group
            </p>
          </div>

          <div className="space-y-0.5">
            <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight">
              {booth.name}
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              {booth.category}
            </p>
          </div>

          {/* 10-Slot Stamp Card Passport Grid */}
          <div className="p-3 bg-white/40 rounded-2xl border border-slate-200/60">
            <div className="grid grid-cols-5 gap-1.5">
              {[...Array(10)].map((_, idx) => {
                const isAwarded = idx === 0 || claimedStamps.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-xs transition-transform ${
                      isAwarded
                        ? 'bg-[#91B9FF] text-blue-900 border border-blue-400 scale-105'
                        : 'bg-[#E2DBCF] text-slate-400 border border-slate-300/60'
                    }`}
                  >
                    <GiftIcon />
                  </div>
                );
              })}
            </div>
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
