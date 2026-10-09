import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import redBowtie from '../../assets/red-bowtie.svg';
import blueGift from '../../assets/blue-gift.svg';
import greyGift from '../../assets/grey-gift.svg';
import dinoSos from '../../assets/dino-sos.png';
import { ArrowLeftIcon } from '../common/Icons';
import { rewardsService, type UserRewardItem } from '../../services/rewardsService';

export interface RewardSelection {
  id: string;
  title: string;
  subtitle: string;
}

interface RewardsModuleProps {
  claimedStamps: string[];
  userProfile?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    ticketType?: string;
  };
  onSelectReward?: (reward: RewardSelection) => void;
  onBackToHome: () => void;
  onClaimStampDemo?: (boothId: string) => void;
}

type BackendScenario = 'physical_box' | 'digital_gacha';

// Sample Mystery Prizes for Scenario 2 (Backend Gacha Determination)
const MYSTERY_PRIZES = [
  {
    id: 'prize-hoodie',
    title: 'DevFest 2026 Dino Hoodie',
    category: 'Legendary Apparel',
    image: dinoSos,
    description: 'Exclusive limited-edition embroidered DevFest Kuala Lumpur hoodie.',
    code: 'DF26-HD-8841',
  },
  {
    id: 'prize-tumbler',
    title: 'Google Cloud Smart Tumbler',
    category: 'Tech Merch',
    image: blueGift,
    description: 'Insulated stainless steel tumbler with temperature display.',
    code: 'DF26-TB-3912',
  },
  {
    id: 'prize-figurine',
    title: 'Android Mascot Collectible',
    category: 'Rare Collectible',
    image: dinoSos,
    description: 'Limited edition DevFest 2026 green chrome Android figurine.',
    code: 'DF26-FIG-5120',
  },
  {
    id: 'prize-pinset',
    title: 'GDGKL Enamel Pin Set',
    category: 'Accessory',
    image: blueGift,
    description: 'Set of 4 collector enamel pins celebrating Google Cloud & Android.',
    code: 'DF26-PIN-9034',
  },
];

export const RewardsModule: React.FC<RewardsModuleProps> = ({
  claimedStamps: initialClaimedStamps,
  userProfile,
  onBackToHome,
}) => {
  const [localStamps, setLocalStamps] = useState<string[]>(initialClaimedStamps);

  React.useEffect(() => {
    setLocalStamps(initialClaimedStamps);
  }, [initialClaimedStamps]);

  const [view, setView] = useState<'stamp_progress' | 'box_picker' | 'redemption'>('stamp_progress');
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [backendScenario, setBackendScenario] = useState<BackendScenario>('physical_box');
  const [isRevealing, setIsRevealing] = useState(false);
  const [wonPrize, setWonPrize] = useState(MYSTERY_PRIZES[0]);
  const [isStaffRedeemed, setIsStaffRedeemed] = useState(false);
  const [physicalBoxReward, setPhysicalBoxReward] = useState<UserRewardItem | null>(null);

  // Participant Rewards State
  const [userRewards, setUserRewards] = useState<UserRewardItem[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [activeVoucherReward, setActiveVoucherReward] = useState<UserRewardItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    rewardTitle: string;
    claimCode: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchUserRewards = async () => {
    if (!userProfile?.email && !userProfile?.id) return;
    setIsLoadingRewards(true);
    try {
      const rewards = await rewardsService.getUserRewards(userProfile.email, userProfile.id);
      setUserRewards(rewards);
      const existingBlindBox = rewards.find((r) => r.rewardType === 'blind_box');
      if (existingBlindBox) {
        setPhysicalBoxReward(existingBlindBox);
        if (existingBlindBox.status === 'claimed') {
          setIsStaffRedeemed(true);
        }
      }
    } catch (err) {
      console.warn('Failed to load user rewards:', err);
    } finally {
      setIsLoadingRewards(false);
    }
  };

  React.useEffect(() => {
    fetchUserRewards();
  }, [userProfile?.email, userProfile?.id]);

  const stampsCount = localStamps.length;
  const isUnlocked = stampsCount >= 10;
  const remainingStamps = Math.max(0, 10 - stampsCount);
  const unclaimedCount = userRewards.filter((r) => r.status !== 'claimed').length;

  // Demo helpers to quickly test 10 stamps
  const handleAddDemoStamp = () => {
    if (localStamps.length < 10) {
      setLocalStamps((prev) => [...prev, `demo-stamp-${prev.length + 1}`]);
    }
  };

  const handleFillAllStamps = () => {
    setLocalStamps(Array.from({ length: 10 }, (_, i) => `demo-stamp-${i + 1}`));
  };

  // Staff claim for participant's swag item with accidental contact confirmation
  const handlePromptStaffClaim = (reward: UserRewardItem) => {
    setConfirmModal({
      isOpen: true,
      rewardTitle: reward.title,
      claimCode: reward.claimCode,
      onConfirm: async () => {
        setIsClaiming(true);
        try {
          const res = await rewardsService.claimUserReward(reward.id, userProfile?.email);
          if (res.success) {
            const nowIso = new Date().toISOString();
            setUserRewards((prev) =>
              prev.map((r) =>
                r.id === reward.id ? { ...r, status: 'claimed', claimedAt: nowIso } : r
              )
            );
            if (activeVoucherReward?.id === reward.id) {
              setActiveVoucherReward((prev) =>
                prev ? { ...prev, status: 'claimed', claimedAt: nowIso } : null
              );
            }
          }
        } catch (err) {
          console.error('Error claiming user reward:', err);
        } finally {
          setIsClaiming(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Staff claim for 10-stamp blind box with accidental contact confirmation
  const handlePromptBlindBoxStaffClaim = () => {
    const isGacha = backendScenario === 'digital_gacha';
    const title = isGacha ? wonPrize.title : (physicalBoxReward?.title || 'DevFest 2026 Mystery Blind Box');
    const code = isGacha ? wonPrize.code : (physicalBoxReward?.claimCode || 'DF26-BOX-0001');

    setConfirmModal({
      isOpen: true,
      rewardTitle: title,
      claimCode: code,
      onConfirm: async () => {
        if (!isGacha && physicalBoxReward?.id) {
          setIsClaiming(true);
          try {
            const res = await rewardsService.claimUserReward(physicalBoxReward.id, userProfile?.email);
            if (res.success) {
              const nowIso = new Date().toISOString();
              setPhysicalBoxReward((prev) => (prev ? { ...prev, status: 'claimed', claimedAt: nowIso } : null));
              setUserRewards((prev) =>
                prev.map((r) => (r.id === physicalBoxReward.id ? { ...r, status: 'claimed', claimedAt: nowIso } : r))
              );
              setIsStaffRedeemed(true);
            }
          } catch (err) {
            console.error('Error claiming blind box reward:', err);
          } finally {
            setIsClaiming(false);
            setConfirmModal(null);
          }
        } else {
          setIsStaffRedeemed(true);
          setConfirmModal(null);
        }
      },
    });
  };

  // Handle Box Selection Confirmation (All 9 choices grant the same physical box)
  const handleConfirmBoxSelection = async () => {
    if (selectedBoxIndex === null) return;

    if (backendScenario === 'digital_gacha') {
      setIsRevealing(true);
      const prize = MYSTERY_PRIZES[selectedBoxIndex % MYSTERY_PRIZES.length];
      setWonPrize(prize);
      setTimeout(() => {
        setIsRevealing(false);
        setView('redemption');
      }, 900);
    } else {
      setIsRevealing(true);
      try {
        const res = await rewardsService.unlockBlindBoxReward(
          userProfile?.id,
          userProfile?.email,
          selectedBoxIndex
        );
        if (res.success && res.reward) {
          setPhysicalBoxReward(res.reward);
          setUserRewards((prev) => {
            const exists = prev.some((r) => r.id === res.reward!.id);
            return exists ? prev.map((r) => (r.id === res.reward!.id ? res.reward! : r)) : [res.reward!, ...prev];
          });
          if (res.reward.status === 'claimed') {
            setIsStaffRedeemed(true);
          }
        }
      } catch (err) {
        console.warn('Error unlocking physical blind box:', err);
      } finally {
        setIsRevealing(false);
        setView('redemption');
      }
    }
  };

  const isWalkIn = (userProfile?.ticketType || '').toLowerCase().includes('walk-in');

  if (isWalkIn) {
    return (
      <motion.div
        key="rewards-walkin-restricted"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col grow overflow-y-auto scrollbar-none pt-4 pb-6 px-2 justify-between min-h-full items-center text-center select-none"
      >
        <div className="w-full max-w-sm mx-auto space-y-5 pt-4 my-auto">
          {/* Main Card */}
          <div className="bg-[#ECE6DA] text-slate-900 rounded-[36px] p-6 pt-7 shadow-2xl border-4 border-[#DED7C9] text-center space-y-4">
            {/* Lock / Restricted Icon */}
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center mx-auto shadow-md">
              <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 bg-amber-200/90 text-amber-900 border border-amber-300 text-[10px] font-mono font-black uppercase rounded-full tracking-wider">
                Walk-in Attendee Pass
              </span>
              <h2 className="font-heading font-black text-2xl text-slate-950 tracking-tight leading-tight">
                Stamp Card & Rewards Restricted
              </h2>
              <p className="font-serif italic font-medium text-xs text-slate-700 leading-relaxed px-1">
                Booth passport stamps, entry swag packs, and blind box mystery rewards are exclusive to pre-registered ticketed attendees.
              </p>
            </div>

            {/* Entitlement Breakdown */}
            <div className="p-4 bg-[#E0D9CD] rounded-2xl border border-[#CDC5B6] text-left space-y-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600">
                Your Pass Inclusions
              </p>
              <ul className="text-xs space-y-1.5 font-medium text-slate-800">
                <li className="flex items-center gap-2 text-emerald-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span>Full Keynote & Breakout Tech Sessions</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span>Partner Exhibition Booth Exploration</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span>Attendee Networking & Friend Discovery</span>
                </li>
                <li className="flex items-center gap-2 text-rose-700 opacity-80">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-bold">✕</span>
                  <span>Official Welcome Swag Pack</span>
                </li>
                <li className="flex items-center gap-2 text-rose-700 opacity-80">
                  <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-bold">✕</span>
                  <span>Passport Stamp Collection & Blind Box</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="pt-4 pb-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#DDD6C8] active:scale-95 text-slate-950 flex items-center justify-center shadow-xl transition-transform cursor-pointer border border-[#DED7C9]"
            aria-label="Back to home"
          >
            <ArrowLeftIcon />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="rewards-sheet"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col grow overflow-y-auto scrollbar-none pt-2 pb-6 px-1 relative select-none justify-between min-h-full"
    >
      <AnimatePresence mode="wait">
        
        {/* ================================================================= */}
        {/* VIEW 1: REWARDS BLIND BOX (STAMP PROGRESS) */}
        {/* ================================================================= */}
        {view === 'stamp_progress' && (
          <motion.div
            key="view-stamp-progress"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col items-center justify-between grow space-y-6 pt-4 pb-2"
          >
            {/* EXPANDED STAMP CARD CONTAINER */}
            <div className="relative w-full max-w-sm mx-auto pt-6">
              
              {/* Red Bowtie Sticker (Overlapping top center boundary) */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <img src={redBowtie} alt="Red Bowtie" className="w-18 h-auto drop-shadow-lg" />
              </div>

              {/* Main Stamp Card (Cream Background with Generous Spacing) */}
              <div className="bg-[#ECE6DA] text-slate-900 rounded-[36px] p-6 pt-9 shadow-2xl border-4 border-[#DED7C9] space-y-5 text-center">
                
                {/* Header Instruction */}
                <p className="font-serif italic font-medium text-sm text-slate-800 tracking-tight">
                  Reach 10 stamps to claim a blind box.
                </p>

                {/* 10 Stamp Boxes Grid (2 rows x 5 columns with larger cells) */}
                <div className="grid grid-cols-5 gap-2.5 pt-2 pb-2">
                  {[...Array(10)].map((_, idx) => {
                    const isClaimed = idx < stampsCount;
                    return (
                      <div
                        key={idx}
                        className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
                          isClaimed
                            ? 'bg-[#D8E5FD] border-2 border-[#91B9FF] shadow-xs'
                            : 'bg-[#E2DBCF]/90 border border-black/5'
                        }`}
                      >
                        <img
                          src={isClaimed ? blueGift : greyGift}
                          alt={isClaimed ? 'Blue Gift' : 'Grey Gift'}
                          className="w-7 h-7 object-contain"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Action / Progress Button */}
                <div className="pt-1">
                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setView('box_picker')}
                      className="w-full h-14 bg-slate-950 hover:bg-slate-800 active:scale-[0.98] transition-all text-white font-heading font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
                    >
                      <img src={blueGift} alt="Gift" className="w-6 h-6 object-contain brightness-200" />
                      <span>Pick Your Blind Box!</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full h-14 bg-[#DED8CC] text-slate-500 font-heading font-bold text-sm rounded-2xl flex items-center justify-center gap-2.5 cursor-not-allowed shadow-inner"
                    >
                      <img src={greyGift} alt="Gift" className="w-5 h-5 object-contain opacity-70" />
                      <span>{remainingStamps} more to go!</span>
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* ============================================================= */}
            {/* PARTICIPANT'S REWARDS: CLAIMED & UNCLAIMED TRACKER            */}
            {/* ============================================================= */}
            <div className="w-full max-w-sm mx-auto space-y-3 pt-1 text-left">
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-black text-sm text-slate-900 tracking-tight">
                    My Rewards & Swags
                  </h4>
                  {unclaimedCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 border border-amber-400 shadow-2xs">
                      {unclaimedCount} Unclaimed
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      All Claimed ✓
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {userRewards.length} Total
                </span>
              </div>

              {/* Rewards List */}
              <div className="space-y-2">
                {isLoadingRewards ? (
                  <div className="bg-[#ECE6DA] rounded-2xl p-4 text-center border-2 border-[#DED7C9] text-xs text-slate-500">
                    Loading your rewards...
                  </div>
                ) : userRewards.length === 0 ? (
                  <div className="bg-[#ECE6DA] rounded-2xl p-4 text-center border-2 border-[#DED7C9] space-y-1 shadow-xs">
                    <p className="text-xs font-semibold text-slate-800">No rewards issued yet.</p>
                    <p className="text-[11px] text-slate-600">Collect stamps from partner booths to unlock blind boxes!</p>
                  </div>
                ) : (
                  userRewards.map((reward) => {
                    const isClaimed = reward.status === 'claimed';
                    return (
                      <div
                        key={reward.id}
                        onClick={() => setActiveVoucherReward(reward)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs ${
                          isClaimed
                            ? 'bg-[#E5DFD4]/70 border-[#D4CCC0] hover:bg-[#E0D9CD]'
                            : 'bg-[#ECE6DA] border-[#DED7C9] hover:bg-[#E4DDD0] hover:shadow-md active:scale-[0.99]'
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isClaimed
                              ? 'bg-slate-200 border-slate-300 opacity-60'
                              : 'bg-blue-100 border-blue-300'
                          }`}
                        >
                          <img
                            src={blueGift}
                            alt="Gift"
                            className={`w-5.5 h-5.5 object-contain ${isClaimed ? 'grayscale opacity-70' : ''}`}
                          />
                        </div>

                        {/* Details */}
                        <div className="grow min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              {reward.rewardType === 'entry_swag' ? 'Entry Swag' : reward.rewardType === 'blind_box' ? 'Blind Box' : 'Event Perk'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {reward.claimCode}
                            </span>
                          </div>
                          <h5 className="font-heading font-extrabold text-xs text-slate-950 truncate">
                            {reward.title}
                          </h5>
                          <p className="text-[10px] text-slate-600 truncate">
                            {reward.subtitle || reward.description}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full border border-slate-300">
                              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Claimed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full shadow-2xs border border-amber-400 transition-colors">
                              <span>Claim</span>
                              <svg className="w-3 h-3 text-amber-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* DEMO TOOLBAR: Quick test buttons */}
            <div className="flex items-center gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={handleAddDemoStamp}
                className="px-3.5 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                +1 Stamp ({stampsCount}/10)
              </button>
              <button
                type="button"
                onClick={handleFillAllStamps}
                className="px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition-colors cursor-pointer"
              >
                ⚡ Unlock 10 Stamps
              </button>
            </div>

            {/* CIRCULAR BACK BUTTON */}
            <div className="pt-4 pb-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#DDD6C8] active:scale-95 text-slate-950 flex items-center justify-center shadow-xl transition-transform cursor-pointer border border-[#DED7C9]"
                aria-label="Back to home"
              >
                <ArrowLeftIcon />
              </button>
            </div>
          </motion.div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: 3D ISOMETRIC BLIND BOX PICKER (BLIND BOX TEST) */}
        {/* ================================================================= */}
        {view === 'box_picker' && (
          <motion.div
            key="view-box-picker"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col items-center justify-between grow space-y-6 pt-3 pb-2"
          >
            {/* MAIN EXPANDED PICKER CARD */}
            <div className="bg-[#ECE6DA] text-slate-900 rounded-[36px] p-6 pt-7 shadow-2xl border-4 border-[#DED7C9] w-full max-w-sm mx-auto text-center space-y-4 flex flex-col justify-between min-h-[460px]">
              
              {/* Heading */}
              <div className="space-y-1">
                <h3 className="font-heading font-black text-2xl text-slate-950 tracking-tight">
                  Pick Your Blind Box!
                </h3>
                <p className="font-serif italic font-medium text-xs text-slate-600">
                  Pick any box to reveal! All 9 choices grant the official DevFest KL 2026 physical blind box.
                </p>
              </div>

              {/* 3D ISOMETRIC 3x3 CUBE GRID (Enlarged and bold) */}
              <div className="w-full flex items-center justify-center py-3 grow">
                <svg
                  viewBox="0 0 320 255"
                  className="w-full h-56 sm:h-64 max-w-[310px] overflow-visible drop-shadow-xl select-none"
                >
                  <defs>
                    {/* Shadow filter for floating selected box */}
                    <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/*
                    Large Isometric 3x3 Diamond Grid Math:
                    Box width: bw = 36, bh = 20, height = 66
                    dx = 44, dy = 24
                    cx = 160, cy = 100
                  */}
                  {[
                    // (col, row, index)
                    [0, 0, 0],
                    [1, 0, 1],
                    [0, 1, 3],
                    [2, 0, 2],
                    [1, 1, 4],
                    [0, 2, 6],
                    [2, 1, 5],
                    [1, 2, 7],
                    [2, 2, 8],
                  ].map(([col, row, idx]) => {
                    const isSelected = selectedBoxIndex === idx;

                    const cx = 160;
                    const cy = 100;
                    const dx = 44;
                    const dy = 24;
                    const bw = 36;  // Box half-width
                    const bh = 20;  // Diamond top half-height
                    const boxHeight = 66; // Vertical height of 3D box
                    const elevation = isSelected ? 16 : 0; // Floating offset

                    const baseX = cx + (col - row) * dx;
                    const baseY = cy + (col + row) * dy - elevation;

                    // 1. Top Diamond Face Points: (top, right, bottom, left)
                    const topFace = `${baseX},${baseY - boxHeight - bh} ${baseX + bw},${baseY - boxHeight} ${baseX},${baseY - boxHeight + bh} ${baseX - bw},${baseY - boxHeight}`;

                    // 2. Left Face Points: (top-left, top-right, bottom-right, bottom-left)
                    const leftFace = `${baseX - bw},${baseY - boxHeight} ${baseX},${baseY - boxHeight + bh} ${baseX},${baseY + bh} ${baseX - bw},${baseY}`;

                    // 3. Right Face Points: (top-left, top-right, bottom-right, bottom-left)
                    const rightFace = `${baseX},${baseY - boxHeight + bh} ${baseX + bw},${baseY - boxHeight} ${baseX + bw},${baseY} ${baseX},${baseY + bh}`;

                    // Color Palette
                    const topColor = isSelected ? '#93C5FD' : '#D8D2C5';
                    const leftColor = isSelected ? '#2563EB' : '#968F81';
                    const rightColor = isSelected ? '#3B82F6' : '#BCB5A7';

                    return (
                      <g
                        key={idx}
                        onClick={() => setSelectedBoxIndex(idx)}
                        className="cursor-pointer transition-all duration-200"
                        style={{ transformOrigin: `${baseX}px ${baseY}px` }}
                        filter={isSelected ? 'url(#boxShadow)' : undefined}
                      >
                        {/* Right Face */}
                        <polygon
                          points={rightFace}
                          fill={rightColor}
                          stroke="#8C8578"
                          strokeWidth="0.8"
                        />

                        {/* Left Face */}
                        <polygon
                          points={leftFace}
                          fill={leftColor}
                          stroke="#7A7367"
                          strokeWidth="0.8"
                        />

                        {/* Top Face */}
                        <polygon
                          points={topFace}
                          fill={topColor}
                          stroke="#B0A99C"
                          strokeWidth="0.8"
                        />

                        {/* Interactive Clickable Overlay */}
                        <polygon
                          points={`${baseX - bw - 4},${baseY - boxHeight - bh - 4} ${baseX + bw + 4},${baseY - boxHeight - bh - 4} ${baseX + bw + 4},${baseY + bh + 4} ${baseX - bw - 4},${baseY + bh + 4}`}
                          fill="transparent"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* ACTION CONFIRM BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmBoxSelection}
                  disabled={selectedBoxIndex === null || isRevealing}
                  className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 transition-all text-sm font-heading font-extrabold cursor-pointer ${
                    selectedBoxIndex !== null && !isRevealing
                      ? 'bg-[#DED8CC] hover:bg-[#D4CDBF] text-slate-950 active:scale-[0.98] shadow-md border border-[#CDC6B7]'
                      : 'bg-[#DED8CC]/70 text-[#A8A29E] cursor-not-allowed border border-transparent'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{isRevealing ? 'Unboxing Mystery Gift...' : 'Confirm Selection'}</span>
                </button>
              </div>

            </div>

            {/* BACK TO STAMPS BUTTON */}
            <div className="pt-4 pb-2">
              <button
                type="button"
                onClick={() => setView('stamp_progress')}
                className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#DDD6C8] active:scale-95 text-slate-950 flex items-center justify-center shadow-xl transition-transform cursor-pointer border border-[#DED7C9]"
                aria-label="Back to stamps"
              >
                <ArrowLeftIcon />
              </button>
            </div>
          </motion.div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: REDEMPTION PASS & COUNTER VERIFICATION */}
        {/* ================================================================= */}
        {view === 'redemption' && (
          <motion.div
            key="view-redemption"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col items-center justify-between grow space-y-5 pt-2 pb-2"
          >
            {/* BACKEND SCENARIO SWITCHER */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-full border border-slate-800 text-[11px] text-slate-300">
              <span className="px-2 text-slate-400 font-mono">Mode:</span>
              <button
                type="button"
                onClick={() => setBackendScenario('physical_box')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  backendScenario === 'physical_box'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Physical Box
              </button>
              <button
                type="button"
                onClick={() => setBackendScenario('digital_gacha')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  backendScenario === 'digital_gacha'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Digital Gacha
              </button>
            </div>

            {/* SCENARIO 1: PHYSICAL BLIND BOX VOUCHER */}
            {backendScenario === 'physical_box' && (
              <div className="bg-[#ECE6DA] text-slate-900 rounded-[36px] p-6 pt-7 shadow-2xl border-4 border-[#DED7C9] w-full max-w-sm mx-auto text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center mx-auto shadow-sm">
                  <img src={blueGift} alt="Gift" className="w-9 h-9 object-contain" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-blue-700 uppercase bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    Official Physical Blind Box
                  </span>
                  <h3 className="font-heading font-black text-2xl text-slate-950 tracking-tight">
                    Box #{((selectedBoxIndex ?? 0) + 1)} Picked!
                  </h3>
                  <p className="font-serif italic font-medium text-xs text-slate-700 leading-relaxed px-2">
                    All 9 box choices award the official DevFest KL 2026 Mystery Blind Box. Show this voucher code to Rewards Counter staff to receive your physical gift.
                  </p>
                </div>

                {/* Voucher Code Box */}
                <div className="p-4 bg-[#E0D9CD] rounded-2xl border border-[#CDC5B6] space-y-1">
                  <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Redemption Pass Code</p>
                  <p className="text-xl font-mono font-black text-slate-950 tracking-wider">
                    {physicalBoxReward?.claimCode || 'DF26-BOX-0001'}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold">
                    ● Active Live Voucher • 10 Stamps Verified
                  </p>
                </div>

                {/* Counter Staff Action */}
                <div className="pt-2">
                  {isStaffRedeemed ? (
                    <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                      ✓ Claimed & Handed Out by Staff
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePromptBlindBoxStaffClaim}
                      className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-heading font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
                    >
                      Counter Staff: Tap to Mark Received
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SCENARIO 2: DIGITAL GACHA DETERMINED REWARD */}
            {backendScenario === 'digital_gacha' && (
              <div className="bg-[#ECE6DA] text-slate-900 rounded-[36px] p-6 pt-7 shadow-2xl border-4 border-[#DED7C9] w-full max-w-sm mx-auto text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto shadow-sm overflow-hidden p-2">
                  <img src={wonPrize.image} alt={wonPrize.title} className="w-full h-full object-contain" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-700 uppercase bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    🎉 {wonPrize.category}
                  </span>
                  <h3 className="font-heading font-black text-xl text-slate-950 tracking-tight leading-tight">
                    {wonPrize.title}
                  </h3>
                  <p className="text-xs text-slate-700 font-sans leading-relaxed px-1">
                    {wonPrize.description}
                  </p>
                </div>

                {/* Voucher Code Box */}
                <div className="p-4 bg-[#E0D9CD] rounded-2xl border border-[#CDC5B6] space-y-1">
                  <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Item Claim Code</p>
                  <p className="text-base font-mono font-black text-slate-950 tracking-wider">
                    {wonPrize.code}
                  </p>
                </div>

                {/* Counter Staff Action */}
                <div className="pt-2">
                  {isStaffRedeemed ? (
                    <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                      ✓ Gift Claimed & Handed Out
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePromptBlindBoxStaffClaim}
                      className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-heading font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
                    >
                      Counter Staff: Tap to Hand Out Prize
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CIRCULAR BACK TO HOME BUTTON */}
            <div className="pt-4 pb-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#DDD6C8] active:scale-95 text-slate-950 flex items-center justify-center shadow-xl transition-transform cursor-pointer border border-[#DED7C9]"
                aria-label="Back to home"
              >
                <ArrowLeftIcon />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ================================================================= */}
      {/* VOUCHER / PASS DETAIL MODAL (Swag Claim Voucher)                  */}
      {/* ================================================================= */}
      <AnimatePresence>
        {activeVoucherReward && (
          <motion.div
            key="voucher-detail-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#ECE6DA] text-slate-900 rounded-[36px] p-6 pt-7 shadow-2xl border-4 border-[#DED7C9] max-w-sm w-full text-center space-y-4 relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveVoucherReward(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-slate-900 cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Gift Icon */}
              <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center mx-auto shadow-sm">
                <img src={blueGift} alt="Gift" className="w-9 h-9 object-contain" />
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-blue-700 uppercase bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                  {activeVoucherReward.rewardType === 'entry_swag' ? 'Official Entry Swag Pass' : 'Exclusive Event Perk'}
                </span>
                <h3 className="font-heading font-black text-xl text-slate-950 tracking-tight leading-tight">
                  {activeVoucherReward.title}
                </h3>
                <p className="font-serif italic font-medium text-xs text-slate-700 leading-relaxed px-2">
                  {activeVoucherReward.subtitle || activeVoucherReward.description}
                </p>
              </div>

              {/* Voucher Pass Code Box */}
              <div className="p-4 bg-[#E0D9CD] rounded-2xl border border-[#CDC5B6] space-y-1">
                <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                  Redemption Pass Code
                </p>
                <p className="text-xl font-mono font-black text-slate-950 tracking-wider">
                  {activeVoucherReward.claimCode}
                </p>
                <p className="text-[10px] text-slate-600">
                  Location: Registration & Helpdesk Counter
                </p>
                <div className="pt-1">
                  {activeVoucherReward.status === 'claimed' ? (
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      ● Claimed & Received by Attendee
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      ● Active Live Voucher • Ready for Collection
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                {activeVoucherReward.status === 'claimed' ? (
                  <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-xs">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Received & Verified by Staff</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePromptStaffClaim(activeVoucherReward)}
                    className="w-full py-4 px-4 bg-slate-950 hover:bg-slate-800 text-white font-heading font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-2"
                  >
                    <span>Counter Staff: Tap to Mark Received</span>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* CONFIRMATION DIALOG MODAL (Prevent accidental contact / tap)      */}
      {/* ================================================================= */}
      <AnimatePresence>
        {confirmModal?.isOpen && (
          <motion.div
            key="confirm-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.18 }}
              className="bg-[#ECE6DA] text-slate-950 rounded-[32px] p-6 text-center space-y-4 max-w-xs w-full shadow-2xl border-4 border-[#DED7C9] relative"
            >
              {/* Warning Icon Shield */}
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 mx-auto flex items-center justify-center shadow-xs">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-lg text-slate-950 tracking-tight leading-snug">
                  Confirm Handout?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Please confirm that the participant has received this item. This action marks the voucher as claimed and cannot be undone.
                </p>
              </div>

              {/* Reward Item Summary */}
              <div className="p-3 bg-[#E0D9CD] rounded-2xl border border-[#CDC5B6] space-y-0.5 text-left">
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Item & Voucher Code</p>
                <p className="text-xs font-heading font-extrabold text-slate-950 truncate">{confirmModal.rewardTitle}</p>
                <p className="text-xs font-mono font-bold text-blue-700">{confirmModal.claimCode}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isClaiming}
                  onClick={() => setConfirmModal(null)}
                  className="h-12 px-4 rounded-xl bg-transparent border border-slate-400 text-slate-700 text-xs font-bold hover:bg-black/5 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isClaiming}
                  onClick={() => confirmModal.onConfirm()}
                  className="h-12 grow rounded-2xl bg-slate-950 text-white text-xs font-heading font-extrabold hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {isClaiming ? (
                    <span>Confirming...</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Confirm Received</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RewardsModule;
