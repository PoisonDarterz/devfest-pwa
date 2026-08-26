import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkNFCSupport } from '../lib/nfc';
import { getAvatarUrl } from '../lib/avatar';
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
import FaqModule from './modules/FaqModule';
import type { RewardSelection } from './modules/RewardsModule';
import RewardRedeemModal from './modals/RewardRedeemModal';
import InfoModals from './modals/InfoModals';

export const HomeScreen: React.FC = () => {
  // Drawer View State
  const [sheetState, setSheetState] = useState<'home' | 'scan_qr_1' | 'scan_qr_2' | 'participant_profile' | 'booth_profile' | 'rewards' | 'faq'>('home');
  const [activeModal, setActiveModal] = useState<'rewards' | 'faq' | 'venue_map' | 'about_gdg' | 'friends' | 'session' | 'profile' | null>(null);

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


  // Notifications & Bookmarking State
  const [savedSessionIds, setSavedSessionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('devfest_saved_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeAlert, setActiveAlert] = useState<Session | null>(null);
  const [isTracklistExpanded, setIsTracklistExpanded] = useState(false);
  const [upcomingCycleIndex, setUpcomingCycleIndex] = useState(0);

  // Automatically collapse tracklist if drawer is expanded to fullscreen modules
  useEffect(() => {
    if (sheetState !== 'home') {
      setIsTracklistExpanded(false);
    }
  }, [sheetState]);

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

  // Toggle saving/bookmarking a session
  const handleToggleSaveSession = async (sessionId: string) => {
    const isSaved = savedSessionIds.includes(sessionId);
    let updated: string[];
    if (isSaved) {
      updated = savedSessionIds.filter(id => id !== sessionId);
    } else {
      updated = [...savedSessionIds, sessionId];
      // Request notification permission when bookmarking
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (err) {
          console.warn('Failed to request notification permission:', err);
        }
      }
    }
    setSavedSessionIds(updated);
    localStorage.setItem('devfest_saved_sessions', JSON.stringify(updated));
  };

  // Simulate notification trigger
  const handleSimulateAlert = (session: Session) => {
    setActiveAlert(session);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DevFest KL 2026', {
        body: `Starting Soon: "${session.title}" at ${session.time} in ${session.room}!`,
        icon: '/favicon.ico',
      });
    }
  };

  // Foreground/Background checker for upcoming sessions starting in less than 5 minutes
  useEffect(() => {
    if (sessions.length === 0) return;

    const parseSessionTimeToToday = (timeStr: string): Date => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      return today;
    };

    const checkUpcomingSessions = () => {
      const now = new Date();
      let reminded: string[] = [];
      try {
        const stored = localStorage.getItem('devfest_reminded_sessions');
        reminded = stored ? JSON.parse(stored) : [];
      } catch {}

      sessions.forEach(sess => {
        if (savedSessionIds.includes(sess.id) && !reminded.includes(sess.id)) {
          const sessionTime = parseSessionTimeToToday(sess.time);
          const diffMs = sessionTime.getTime() - now.getTime();
          const diffMins = diffMs / (1000 * 60);

          if (diffMins > -1 && diffMins <= 5) {
            setActiveAlert(sess);

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('DevFest KL 2026', {
                body: `Starting Soon: "${sess.title}" at ${sess.time} in ${sess.room}!`,
                icon: '/favicon.ico',
              });
            }

            reminded.push(sess.id);
            localStorage.setItem('devfest_reminded_sessions', JSON.stringify(reminded));
          }
        }
      });
    };

    checkUpcomingSessions();
    const timer = setInterval(checkUpcomingSessions, 10000);

    return () => clearInterval(timer);
  }, [sessions, savedSessionIds]);

  const activeSession = sessions[selectedSessionIndex] || sessions[0];
  const track1Sessions = sessions.filter(s => s.track === 'AI / ML' || s.track === 'Keynote');
  const track2Sessions = sessions.filter(s => s.track === 'Cloud & DevOps');
  const track3Sessions = sessions.filter(s => s.track === 'Mobile & Flutter' || s.track === 'Web & Chrome');

  // Helper to parse session time to Date
  const parseSessionTimeToDate = (timeStr: string): Date => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    return today;
  };

  // Get eligible upcoming sessions starting at the closest next time or within 15 minutes of it
  const getEligibleUpcomingSessions = (): Session[] => {
    if (sessions.length === 0) return [];
    
    const now = new Date();
    
    // 1. Get all future/ongoing sessions (started less than 10 mins ago)
    const futureSessions = sessions.filter(s => {
      const sTime = parseSessionTimeToDate(s.time);
      return sTime.getTime() - now.getTime() > -10 * 60 * 1000;
    });

    if (futureSessions.length === 0) {
      return sessions.slice(-3); // Fallback to last few if all passed
    }

    // 2. Sort by time ascending
    const sorted = [...futureSessions].sort((a, b) => {
      return parseSessionTimeToDate(a.time).getTime() - parseSessionTimeToDate(b.time).getTime();
    });

    // 3. Find the closest next start time
    const closestTime = parseSessionTimeToDate(sorted[0].time).getTime();

    // 4. Filter sessions that start at the closest time or within 15 minutes of it
    return sorted.filter(s => {
      const sTime = parseSessionTimeToDate(s.time).getTime();
      const diffMins = (sTime - closestTime) / (1000 * 60);
      return diffMins >= 0 && diffMins <= 15;
    });
  };

  const eligibleUpcomingSessions = getEligibleUpcomingSessions();
  const activeUpcomingSession = eligibleUpcomingSessions[upcomingCycleIndex] || activeSession;

  // Auto-rotate upcoming sessions
  useEffect(() => {
    if (eligibleUpcomingSessions.length <= 1) {
      setUpcomingCycleIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setUpcomingCycleIndex(prev => (prev + 1) % eligibleUpcomingSessions.length);
    }, 4000); // Cycle every 4 seconds

    return () => clearInterval(timer);
  }, [eligibleUpcomingSessions.length]);
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
    setIsTracklistExpanded(false);
    if (info.offset.y > 80 || info.velocity.y > 200) {
      if (sheetState === 'scan_qr_2') {
        setSheetState('scan_qr_1');
      } else {
        setSheetState('home');
      }
    }
  };

  const renderSessionCard = (sess: Session, bgColor: string) => {
    const isSaved = savedSessionIds.includes(sess.id);
    const isSelected = sessions[selectedSessionIndex]?.id === sess.id;
    const sessionIdx = sessions.findIndex(s => s.id === sess.id);

    return (
      <button
        key={sess.id}
        onClick={() => {
          setSelectedSessionIndex(sessionIdx !== -1 ? sessionIdx : 0);
          setActiveModal('session');
        }}
        className={`text-left ${bgColor} text-white text-xs font-medium px-3.5 rounded-xl shadow-sm transition-all active:scale-98 cursor-pointer flex items-center justify-between shrink-0 snap-start ${
          isTracklistExpanded 
            ? 'w-[230px] py-2.5' 
            : 'w-[170px] py-2'
        } ${
          isSelected ? 'ring-2 ring-white/60' : ''
        }`}
      >
        {isTracklistExpanded ? (
          <div className="flex flex-col gap-0.5 grow pr-2 min-w-0">
            <span className="font-extrabold text-[11px] leading-tight text-white whitespace-normal break-words">{sess.title}</span>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] text-white/80 font-normal">
              <span className="truncate max-w-[80px]">{sess.speaker.name}</span>
              <span>•</span>
              <span className="truncate max-w-[60px]">{sess.room}</span>
              <span>•</span>
              <span className="font-mono text-[8px] bg-black/20 px-1 rounded">{sess.time}</span>
            </div>
          </div>
        ) : (
          <span className="truncate pr-2 text-[11px] min-w-0">{sess.title}</span>
        )}
        
        {isSaved && (
          <svg className="w-3 h-3 text-emerald-300 ml-1.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
      </button>
    );
  };

  const isExpanded = sheetState !== 'home';
  const drawerHeight = isExpanded
    ? 'calc(100% - 64px)'
    : isTracklistExpanded
      ? 'calc(100% - 475px)'
      : 'calc(100% - 365px)';

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
              <img src={getAvatarUrl(userProfile.avatar, userProfile.email || userProfile.name)} alt="User Profile" className="w-full h-full object-cover" />
            </button>
          </div>

          {/* ONGOING SESSIONS */}
          <div className="space-y-2 relative z-10">
            <div 
              onClick={() => setIsTracklistExpanded(!isTracklistExpanded)}
              className="flex items-center justify-between cursor-pointer group select-none"
            >
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900/90 font-mono flex items-center gap-1">
                <span>ONGOING SESSIONS</span>
                <svg 
                  className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isTracklistExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </h2>
              <span className="text-[10px] font-bold text-slate-900/70 group-hover:text-slate-950 transition-colors">
                {isTracklistExpanded ? 'Show less' : 'Tap to expand'}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Row for Track 1 */}
              <div className="flex gap-2.5 items-center">
                <span className="text-[10px] font-extrabold text-slate-900/90 border-l-2 border-slate-900/80 pl-2 shrink-0 w-12 uppercase tracking-wider font-mono">Track 1</span>
                <div className="grow flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pr-1 py-0.5">
                  {track1Sessions.map((sess) => renderSessionCard(sess, 'bg-[#2B6396] hover:bg-[#255480]'))}
                </div>
              </div>

              {/* Row for Track 2 */}
              <div className="flex gap-2.5 items-center">
                <span className="text-[10px] font-extrabold text-slate-900/90 border-l-2 border-slate-900/80 pl-2 shrink-0 w-12 uppercase tracking-wider font-mono">Track 2</span>
                <div className="grow flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pr-1 py-0.5">
                  {track2Sessions.map((sess) => renderSessionCard(sess, 'bg-[#3B7A57] hover:bg-[#326749]'))}
                </div>
              </div>

              {/* Row for Track 3 */}
              <div className="flex gap-2.5 items-center">
                <span className="text-[10px] font-extrabold text-slate-900/90 border-l-2 border-slate-900/80 pl-2 shrink-0 w-12 uppercase tracking-wider font-mono">Track 3</span>
                <div className="grow flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pr-1 py-0.5">
                  {track3Sessions.map((sess) => renderSessionCard(sess, 'bg-[#8C4A36] hover:bg-[#773E2D]'))}
                </div>
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

            <button onClick={() => setSheetState('faq')} className="flex flex-col items-center gap-1 group cursor-pointer">
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
          animate={{ height: drawerHeight }}
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
                {activeUpcomingSession && (
                  <div
                    onClick={() => {
                      const idx = sessions.findIndex(s => s.id === activeUpcomingSession.id);
                      setSelectedSessionIndex(idx !== -1 ? idx : 0);
                      setActiveModal('session');
                    }}
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
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="relative z-10 space-y-3 pr-6"
                      >
                        <div className="flex items-start gap-3">
                          <img src={activeUpcomingSession.speaker.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/20 shadow-md" />
                          <div className="space-y-1 grow">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80 font-mono italic">
                                UPCOMING SESSION ({activeUpcomingSession.time})
                              </span>
                              {savedSessionIds.includes(activeUpcomingSession.id) && (
                                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              )}
                            </div>
                            <h3 className="font-heading font-extrabold text-base text-white leading-snug">
                              {activeUpcomingSession.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-xs text-blue-100/90 leading-relaxed font-normal line-clamp-2">
                          {activeUpcomingSession.description}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    {eligibleUpcomingSessions.length > 1 && (
                      <div className="absolute bottom-3 right-4 flex gap-1.5 z-20">
                        {eligibleUpcomingSessions.map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                              upcomingCycleIndex === i ? 'bg-white scale-125' : 'bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    )}
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
                    onClick={() => setSheetState('faq')}
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

            {/* STATE 7: FAQ & INFO MODULE */}
            {sheetState === 'faq' && (
              <FaqModule
                onOpenDialog={(dialogType) => setActiveModal(dialogType)}
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
          savedSessionIds={savedSessionIds}
          onToggleSaveSession={handleToggleSaveSession}
          onSimulateAlert={handleSimulateAlert}
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

        {/* IN-APP ALERT OVERLAY */}
        <AnimatePresence>
          {activeAlert && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-4 left-4 right-4 z-[100] bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-blue-500/40 shadow-2xl flex items-start gap-3 text-white max-w-sm mx-auto"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="grow space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Starting Soon</p>
                <h4 className="text-xs font-extrabold font-heading text-white">{activeAlert.title}</h4>
                <p className="text-[10px] text-slate-300">Room: {activeAlert.room} • Time: {activeAlert.time}</p>
                <p className="text-[10px] text-slate-400">Speaker: {activeAlert.speaker.name}</p>
              </div>
              <button
                onClick={() => setActiveAlert(null)}
                className="p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white cursor-pointer self-start"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default HomeScreen;
