import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import redBowtie from '../../assets/red-bowtie.svg';
import blueGift from '../../assets/blue-gift.svg';
import greyGift from '../../assets/grey-gift.svg';
import dinoSos from '../../assets/dino-sos.png';
import { ArrowLeftIcon } from '../common/Icons';

export interface RewardSelection {
  id: string;
  title: string;
  subtitle: string;
}

interface RewardsModuleProps {
  claimedStamps: string[];
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
  onBackToHome,
}) => {
  const [localStamps, setLocalStamps] = useState<string[]>(initialClaimedStamps);
  const [view, setView] = useState<'stamp_progress' | 'box_picker' | 'redemption'>('stamp_progress');
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [backendScenario, setBackendScenario] = useState<BackendScenario>('physical_box');
  const [isRevealing, setIsRevealing] = useState(false);
  const [wonPrize, setWonPrize] = useState(MYSTERY_PRIZES[0]);
  const [isStaffRedeemed, setIsStaffRedeemed] = useState(false);

  const stampsCount = localStamps.length;
  const isUnlocked = stampsCount >= 10;
  const remainingStamps = Math.max(0, 10 - stampsCount);

  // Demo helpers to quickly test 10 stamps
  const handleAddDemoStamp = () => {
    if (localStamps.length < 10) {
      setLocalStamps((prev) => [...prev, `demo-stamp-${prev.length + 1}`]);
    }
  };

  const handleFillAllStamps = () => {
    setLocalStamps(Array.from({ length: 10 }, (_, i) => `demo-stamp-${i + 1}`));
  };

  // Handle Box Selection Confirmation
  const handleConfirmBoxSelection = () => {
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
      setView('redemption');
    }
  };

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
                  You only get to choose one, obviously.
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
                    Physical Blind Box Voucher
                  </span>
                  <h3 className="font-heading font-black text-2xl text-slate-950 tracking-tight">
                    Box #{((selectedBoxIndex ?? 0) + 1)} Selected!
                  </h3>
                  <p className="font-serif italic font-medium text-xs text-slate-700 leading-relaxed px-2">
                    Show this screen to the Rewards Counter staff to receive your physical blind box.
                  </p>
                </div>

                {/* Voucher Code Box */}
                <div className="p-4 bg-[#E0D9CD] rounded-2xl border border-[#CDC5B6] space-y-1">
                  <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Redemption Pass Code</p>
                  <p className="text-lg font-mono font-black text-slate-950 tracking-wider">
                    DF26-BOX-0{(selectedBoxIndex ?? 0) + 1}
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
                      onClick={() => setIsStaffRedeemed(true)}
                      className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-heading font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
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
                      onClick={() => setIsStaffRedeemed(true)}
                      className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-heading font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
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
    </motion.div>
  );
};

export default RewardsModule;
