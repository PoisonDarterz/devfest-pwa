import React from 'react';
import { QrScanIcon, GiftIcon, HelpIcon, FriendsNodesIcon } from '../common/Icons';

interface QuickActionsGridProps {
  onOpenQr: () => void;
  onOpenRewards: () => void;
  onOpenFaq: () => void;
  onOpenFriends: () => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onOpenQr,
  onOpenRewards,
  onOpenFaq,
  onOpenFriends,
}) => {
  return (
    <div className="grid grid-cols-4 gap-2 pt-1 pb-2 relative z-10 text-center">
      <button
        onClick={onOpenQr}
        className="flex flex-col items-center gap-1 group cursor-pointer"
      >
        <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
          <QrScanIcon />
        </div>
        <span className="text-[11px] font-bold text-slate-900">QR Code / NFC</span>
      </button>

      <button
        onClick={onOpenRewards}
        className="flex flex-col items-center gap-1 group cursor-pointer"
      >
        <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
          <GiftIcon />
        </div>
        <span className="text-[11px] font-bold text-slate-900">Rewards</span>
      </button>

      <button
        onClick={onOpenFaq}
        className="flex flex-col items-center gap-1 group cursor-pointer"
      >
        <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
          <HelpIcon />
        </div>
        <span className="text-[11px] font-bold text-slate-900">FAQ & Info</span>
      </button>

      <button
        onClick={onOpenFriends}
        className="flex flex-col items-center gap-1 group cursor-pointer"
      >
        <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
          <FriendsNodesIcon />
        </div>
        <span className="text-[11px] font-bold text-slate-900">Friends</span>
      </button>
    </div>
  );
};
