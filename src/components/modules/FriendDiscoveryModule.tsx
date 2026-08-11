import React from 'react';
import { motion } from 'framer-motion';
import pinkFlower from '../../assets/pink-flower.svg';
import bluePlus from '../../assets/blue-plus.svg';
import redHeart from '../../assets/red-heart.svg';
import GdgKlLogo from '../common/GdgKlLogo';
import { ArrowLeftIcon } from '../common/Icons';

interface FriendDiscoveryModuleProps {
  friend: {
    name: string;
    role: string;
    avatar: string;
  };
  onBackToHome: () => void;
}

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
      <div className="relative w-full max-w-[280px] pt-4 my-auto">
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
          <div className="space-y-0.5 pt-1">
            <h2 className="font-heading font-bold text-2xl text-slate-950 tracking-tight">
              New discovery!
            </h2>
            <p className="text-xs italic text-slate-600 font-serif">
              You met a new friend.
            </p>
          </div>

          <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden border-2 border-slate-800 shadow-md">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-0.5">
            <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight">
              {friend.name}
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              {friend.role}
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

export default FriendDiscoveryModule;
