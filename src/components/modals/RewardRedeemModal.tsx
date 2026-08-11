import React from 'react';
import blueGift from '../../assets/blue-gift.svg';
import GoogleGIcon from '../common/GoogleGIcon';
import { CloseIcon } from '../common/Icons';

interface RewardRedeemModalProps {
  reward: {
    id: string;
    title: string;
    subtitle: string;
  };
  isRedeemed: boolean;
  onRedeem: (rewardId: string) => void;
  onClose: () => void;
}

export const RewardRedeemModal: React.FC<RewardRedeemModalProps> = ({
  reward,
  isRedeemed,
  onRedeem,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#ECE6DA] text-slate-900 rounded-[32px] p-6 text-center space-y-4 max-w-xs w-full shadow-2xl border-4 border-[#DED7C9] relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-slate-900 cursor-pointer"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-white/80 mx-auto flex items-center justify-center shadow-md border border-slate-200/60 pt-1">
          <GoogleGIcon className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <h3 className="font-heading font-extrabold text-xl text-slate-950 tracking-tight leading-tight">
            {reward.title}
          </h3>
          <p className="text-xs italic text-slate-600 font-sans leading-relaxed">
            {reward.subtitle}
          </p>
        </div>

        <div className="pt-2">
          {isRedeemed || reward.id === 'gemini-redeemed' ? (
            <button
              disabled
              className="w-full py-3.5 px-6 bg-[#D4CCC0]/80 text-slate-500 font-bold text-sm rounded-full flex items-center justify-center gap-2 shadow-inner cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Redeemed</span>
            </button>
          ) : (
            <button
              onClick={() => onRedeem(reward.id)}
              className="w-full py-3.5 px-6 bg-[#E0D9CC] hover:bg-[#D4CCC0] text-slate-950 font-bold text-sm rounded-full flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer border border-black/5"
            >
              <img src={blueGift} alt="Gift" className="w-5 h-5 object-contain" />
              <span>Redeem</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardRedeemModal;
