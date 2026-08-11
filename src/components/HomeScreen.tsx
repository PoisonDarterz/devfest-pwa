import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkNFCSupport } from '../lib/nfc';
import { ApiService } from '../services/apiService';
import { MOCK_DISCOVERED_FRIEND } from '../data/mockData';
import type { Session, Booth, FAQItem } from '../lib/types';

// Common Components
import gdgklLogo from '../assets/GDGKL-logo.png';
import pinkFlower from '../assets/pink-flower.svg';
import yellowArrow from '../assets/yellow-arrow.svg';
import greenHashtag from '../assets/green-hashtag.svg';
import dinoSos from '../assets/dino-sos.png';
import { QrScanIcon, GiftIcon, HelpIcon, FriendsNodesIcon } from './common/Icons';

// Sub-Modules & Modals
import PassBadgeModule from './modules/PassBadgeModule';
import ScannerCameraModule from './modules/ScannerCameraModule';
import FriendDiscoveryModule from './modules/FriendDiscoveryModule';
import BoothDiscoveryModule from './modules/BoothDiscoveryModule';
import RewardsModule from './modules/RewardsModule';
import type { RewardSelection } from './modules/RewardsModule';
import RewardRedeemModal from './modals/RewardRedeemModal';
import InfoModals from './modals/InfoModals';

export const HomeScreen: React.FC = () => {
  // Drawer View State
  const [sheetState, setSheetState] = useState<'home' | 'scan_qr_1' | 'scan_qr_2' | 'participant_profile' | 'booth_profile' | 'rewards'>('home');
  const [activeModal, setActiveModal] = useState<'rewards' | 'faq' | 'friends' | 'session' | 'profile' | null>(null);

  // Data States
  const [booths, setBooths] = useState<Booth[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [userProfile, setUserProfile] = useState({
    name: 'Zixu Cheah',
    role: 'Software Engineer',
    email: 'zixu.cheah@devfest.kl',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    qrPayload: 'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
  });

  // UI Interactive States
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);
  const [claimedStamps, setClaimedStamps] = useState<string[]>(['b1']);
  const [stampFeedback, setStampFeedback] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [rewardRedeemState, setRewardRedeemState] = useState<{ [key: string]: boolean }>({});
  const [selectedReward, setSelectedReward] = useState<RewardSelection | null>(null);

  const nfcStatus = checkNFCSupport();

  // Load Data via Service Layer
  useEffect(() => {
    async function loadInitialData() {
      const [fetchedSessions, fetchedBooths, fetchedFaqs, fetchedUser] = await Promise.all([
        ApiService.getSessions(),
        ApiService.getBooths(),
        ApiService.getFAQs(),
        ApiService.getUserProfile(),
      ]);
      setSessions(fetchedSessions);
      setBooths(fetchedBooths);
      setFaqs(fetchedFaqs);
      if (fetchedUser) setUserProfile(fetchedUser);
    }
    loadInitialData();
  }, []);

  const activeSession = sessions[selectedSessionIndex] || sessions[0];
  const discoveredBooth = booths[0] || {
    id: 'b1',
    name: '42KL',
    category: 'Community',
    logoText: '42 KL',
    location: 'Hall A - #01',
    description: '',
    boothCode: '42KL',
    points: 15,
  };

  const handleScanResult = (decodedText: string) => {
    setScanResult(decodedText);
    if (decodedText.toLowerCase().includes('booth')) {
      handleClaimStamp('b1');
      setSheetState('booth_profile');
    } else {
      setSheetState('participant_profile');
    }
  };

  const handleClaimStamp = async (boothId: string) => {
    const res = await ApiService.claimBoothStamp(boothId, claimedStamps);
    setClaimedStamps(res.stamps);
    setStampFeedback(res.message);
  };

  const handleRedeemReward = async (rewardId: string) => {
    await ApiService.redeemReward(rewardId);
    setRewardRedeemState((prev) => ({ ...prev, [rewardId]: true }));
  };

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 80 || info.velocity.y > 200) {
      if (sheetState === 'scan_qr_2') {
        setSheetState('scan_qr_1');
      } else {
        setSheetState('home');
      }
    }
  };

  const isExpanded = sheetState !== 'home';

  return (
    <div className="h-screen bg-[#3B9E59] text-slate-900 flex flex-col items-center justify-start overflow-hidden font-sans select-none">
      <div className="w-full max-w-md h-full flex flex-col relative shadow-2xl overflow-hidden bg-[#3B9E59]">
        
        {/* TOP GREEN HEADER */}
        <div className="p-5 pt-6 pb-2 space-y-4 relative shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          {/* Header Bar */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <img src={gdgklLogo} alt="GDG Logo" className="h-7 w-auto object-contain shrink-0" />
              <h1 className="font-heading font-black text-2xl text-slate-950 tracking-tight">
                DevFest
              </h1>
              <span className="bg-[#F7B033] text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-black/10 shadow-sm">
                2026
              </span>
            </div>

            <button
              onClick={() => setActiveModal('profile')}
              className="w-10 h-10 rounded-full border-2 border-emerald-900 overflow-hidden bg-slate-200 shadow-md transition-transform active:scale-95 cursor-pointer"
              aria-label="User Profile"
            >
              <img src={userProfile.avatar} alt="User Profile" className="w-full h-full object-cover" />
            </button>
          </div>

          {/* ONGOING SESSIONS */}
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900/90 font-mono">
                ONGOING SESSIONS
              </h2>
              <span className="text-[10px] font-bold text-slate-900/70">Tap session to view</span>
            </div>

            <div className="flex gap-3 items-stretch">
              <div className="flex flex-col justify-around text-xs font-semibold text-slate-900/90 border-l-2 border-slate-900/80 pl-2.5 py-1 shrink-0">
                <span>Track 1</span>
                <span>Track 2</span>
                <span>Track 3</span>
              </div>

              <div className="grow space-y-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pr-1">
                {sessions.map((sess, idx) => {
                  const bgColors = ['bg-[#2B6396] hover:bg-[#255480]', 'bg-[#3B7A57] hover:bg-[#326749]', 'bg-[#8C4A36] hover:bg-[#773E2D]'];
                  const bgColor = bgColors[idx % bgColors.length];
                  return (
                    <button
                      key={sess.id || idx}
                      onClick={() => {
                        setSelectedSessionIndex(idx);
                        setActiveModal('session');
                      }}
                      className={`w-full text-left ${bgColor} text-white text-xs font-medium px-3.5 py-2 rounded-xl truncate shadow-sm transition-all active:scale-98 cursor-pointer ${
                        selectedSessionIndex === idx ? 'ring-2 ring-white/60' : ''
                      }`}
                    >
                      {sess.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Action Grid Icons */}
          <div className="grid grid-cols-4 gap-2 pt-1 pb-2 relative z-10 text-center">
            <button onClick={() => setSheetState('scan_qr_1')} className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
                <QrScanIcon />
              </div>
              <span className="text-[11px] font-bold text-slate-900">Scan QR</span>
            </button>

            <button onClick={() => setSheetState('rewards')} className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
                <GiftIcon />
              </div>
              <span className="text-[11px] font-bold text-slate-900">Rewards</span>
            </button>

            <button onClick={() => setActiveModal('faq')} className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
                <HelpIcon />
              </div>
              <span className="text-[11px] font-bold text-slate-900">FAQ & Info</span>
            </button>

            <button onClick={() => setActiveModal('friends')} className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
                <FriendsNodesIcon />
              </div>
              <span className="text-[11px] font-bold text-slate-900">Friends</span>
            </button>
          </div>
        </div>

        {/* BOTTOM SHEET DRAWER */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
          initial={false}
          animate={{ height: isExpanded ? 'calc(100% - 64px)' : 'calc(100% - 365px)' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="absolute left-0 right-0 bottom-0 bg-[#1C1D21] text-slate-100 rounded-t-[32px] p-5 pt-3 pb-6 border-t border-slate-800 shadow-2xl flex flex-col justify-between z-30 touch-pan-y"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto shrink-0 mb-2 cursor-grab active:cursor-grabbing"></div>

          <AnimatePresence mode="wait">
            {/* STATE 1: HOME SHEET */}
            {sheetState === 'home' && (
              <motion.div
                key="home-sheet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-5 overflow-y-auto overscroll-contain scrollbar-none grow flex flex-col justify-between"
              >
                {activeSession && (
                  <div
                    onClick={() => setActiveModal('session')}
                    className="relative bg-[#273C70] rounded-2xl p-5 overflow-hidden shadow-xl border border-blue-900/50 cursor-pointer hover:border-blue-500/50 transition-all active:scale-[0.99] shrink-0"
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

                    <div className="relative z-10 space-y-3 pr-6">
                      <div className="flex items-start gap-3">
                        <img src={activeSession.speaker.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/20 shadow-md" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80 font-mono italic">
                            UPCOMING SESSION ({activeSession.time})
                          </span>
                          <h3 className="font-heading font-extrabold text-base text-white leading-snug">
                            {activeSession.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-blue-100/90 leading-relaxed font-normal">
                        {activeSession.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Met Someone New Row */}
                <div className="pt-2 pb-2 border-b border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif italic font-normal text-xl text-white tracking-tight">
                      Met Someone New?
                    </h3>
                    <p className="text-xs text-slate-400 font-sans">Add them as a friend here</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSheetState('participant_profile')}
                      className="w-12 h-12 rounded-full bg-[#EAE4D9] text-[#1C1D21] flex items-center justify-center shadow-lg hover:scale-105 transition-transform shrink-0 active:scale-95 cursor-pointer"
                    >
                      <FriendsNodesIcon />
                    </button>
                  </div>
                </div>

                {/* Lost in the desert Row */}
                <div className="pt-1 pb-2 flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-300 font-sans">Or perhaps lost in the desert...?</p>
                    <img src={dinoSos} alt="Chrome Dino" className="h-7 object-contain opacity-80" />
                  </div>
                  <button
                    onClick={() => setActiveModal('faq')}
                    className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#EAE4D9] text-[#1C1D21] font-bold text-xs shadow-lg hover:scale-105 transition-transform shrink-0 active:scale-95 cursor-pointer"
                  >
                    <HelpIcon />
                    <span>FAQ & Info</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE 2: PASS BADGE */}
            {sheetState === 'scan_qr_1' && (
              <PassBadgeModule
                userName={userProfile.name}
                userRole={userProfile.role}
                qrPayload={userProfile.qrPayload}
                onOpenScanner={() => setSheetState('scan_qr_2')}
              />
            )}

            {/* STATE 3: CAMERA SCANNER */}
            {sheetState === 'scan_qr_2' && (
              <ScannerCameraModule
                scanResult={scanResult}
                onScanResult={handleScanResult}
                onClearScan={() => setScanResult(null)}
                onBackToBadge={() => setSheetState('scan_qr_1')}
                onTriggerFriendDemo={() => setSheetState('participant_profile')}
                onTriggerBoothDemo={() => setSheetState('booth_profile')}
              />
            )}

            {/* STATE 4: FRIEND DISCOVERY */}
            {sheetState === 'participant_profile' && (
              <FriendDiscoveryModule
                friend={MOCK_DISCOVERED_FRIEND}
                onBackToHome={() => setSheetState('home')}
              />
            )}

            {/* STATE 5: BOOTH DISCOVERY */}
            {sheetState === 'booth_profile' && (
              <BoothDiscoveryModule
                booth={discoveredBooth}
                claimedStamps={claimedStamps}
                onBackToHome={() => setSheetState('home')}
              />
            )}

            {/* STATE 6: REWARDS MODULE */}
            {sheetState === 'rewards' && (
              <RewardsModule
                claimedStamps={claimedStamps}
                onSelectReward={(r) => setSelectedReward(r)}
                onBackToHome={() => setSheetState('home')}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* INFO MODALS */}
        <InfoModals
          activeModal={activeModal}
          booths={booths}
          faqs={faqs}
          claimedStamps={claimedStamps}
          stampFeedback={stampFeedback}
          nfcMessage={nfcStatus.message}
          activeSession={activeSession}
          userProfile={userProfile}
          onClaimStampDemo={(id) => handleClaimStamp(id)}
          onClose={() => setActiveModal(null)}
        />

        {/* INDIVIDUAL REWARD REDEEM POPUP MODAL */}
        {selectedReward && (
          <RewardRedeemModal
            reward={selectedReward}
            isRedeemed={!!rewardRedeemState[selectedReward.id]}
            onRedeem={handleRedeemReward}
            onClose={() => setSelectedReward(null)}
          />
        )}

      </div>
    </div>
  );
};

export default HomeScreen;
