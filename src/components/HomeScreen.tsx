import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { checkNFCSupport } from '../lib/nfc';

// Import Real Figma Sticker Assets from src/assets
import pinkFlower from '../assets/pink-flower.svg';
import yellowArrow from '../assets/yellow-arrow.svg';
import greenHashtag from '../assets/green-hashtag.svg';
import dinoSos from '../assets/dino-sos.png';
import bluePlus from '../assets/blue-plus.svg';
import redHeart from '../assets/red-heart.svg';
import yellowStar from '../assets/yellow-star.svg';

interface Booth {
  id: string;
  name: string;
  category: string;
  logoText: string;
  location: string;
}

interface Session {
  id: string;
  title: string;
  speaker: {
    name: string;
    role: string;
    avatar: string;
  };
  room: string;
  time: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const MOCK_BOOTHS: Booth[] = [
  { id: 'b1', name: '42KL', category: 'Partner', logoText: '42 KL | Sunway Education Group', location: 'Hall A - #01' },
  { id: 'b2', name: 'Google Cloud Malaysia', category: 'Platinum Sponsor', logoText: 'Google Cloud', location: 'Hall A - #02' },
  { id: 'b3', name: 'Flutter Community', category: 'Community', logoText: 'Flutter MY', location: 'Hall A - #04' },
  { id: 'b4', name: 'TensorFlow & Gemini AI', category: 'Gold Sponsor', logoText: 'TensorFlow', location: 'Hall B - #10' },
];

const MOCK_SESSIONS: Session[] = [
  {
    id: 's1',
    title: 'Develop multi agent system with Agent Development Kit',
    speaker: {
      name: 'Liam & Megan Kasselberg',
      role: 'Senior UX Writer & GDE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    room: 'Main Auditorium',
    time: '10:30 AM',
    description: 'Liam speaks with Megan Kasselberg, whose work as a senior UX writer and content designer touches billions of users through the Material Design system.',
  },
  {
    id: 's2',
    title: 'From Docker to Docker Compose Workflows',
    speaker: {
      name: 'Sarah Lim',
      role: 'DevOps Lead @ TechScale',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    },
    room: 'Hall A (Tech Stage)',
    time: '11:30 AM',
    description: 'Learn best practices for multi-container orchestration, development setup, and production deployment pipeline security.',
  },
  {
    id: 's3',
    title: 'Getting Started with MCP, ADK and A2A Architectures',
    speaker: {
      name: 'Jonas Tan',
      role: 'Staff AI Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    room: 'Hall B (Web Stage)',
    time: '02:00 PM',
    description: 'Explore Model Context Protocol (MCP), Agent Development Kit, and Agent-to-Agent protocol paradigms.',
  },
];

const MOCK_FAQS: FAQItem[] = [
  {
    question: 'How do I check in with my Peatix ticket?',
    answer: 'Sign in with your Google account used on Peatix. Your QR code will be generated automatically for entry scanning.',
  },
  {
    question: 'Where is Google DevFest KL 2026 located?',
    answer: 'KL Convention Centre (KLCC), Level 3 Grand Ballroom. Accessible via LRT Kelana Jaya Line & MRT Putrajaya Line.',
  },
  {
    question: 'How does the NFC Phone Bump feature work?',
    answer: 'On Android Chrome, tap "Friends" and hold devices back-to-back to swap contact profiles automatically!',
  },
];

// Icons
const QrScanIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="3" height="3" />
    <path d="M18 14v3h3v4h-4v-3" />
  </svg>
);

const GiftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" rx="1" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const HelpIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const FriendsNodesIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const GdgKlLogo = () => (
  <div className="flex items-center gap-1.5 justify-center text-slate-900 font-extrabold tracking-tight">
    <div className="flex items-center -space-x-1">
      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
    </div>
    <span className="font-heading font-black text-sm text-slate-900 tracking-tight ml-1">
      GDG<span className="text-[#3B72EF]">KL</span>
    </span>
  </div>
);

export const HomeScreen: React.FC = () => {
  // Drawer View State: 'home' | 'scan_qr_1' | 'scan_qr_2' | 'participant_profile' | 'booth_profile'
  const [sheetState, setSheetState] = useState<'home' | 'scan_qr_1' | 'scan_qr_2' | 'participant_profile' | 'booth_profile'>('home');
  const [activeModal, setActiveModal] = useState<'rewards' | 'faq' | 'friends' | 'session' | 'profile' | null>(null);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);
  const [claimedStamps, setClaimedStamps] = useState<string[]>(['b1']);
  const [stampFeedback, setStampFeedback] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Scanned discovery state
  const [discoveredFriend] = useState<{ name: string; role: string; avatar: string }>({
    name: 'Jonas Chuan',
    role: 'Participant',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  });

  const [discoveredBooth] = useState<Booth>(MOCK_BOOTHS[0]);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const nfcStatus = checkNFCSupport();
  const activeSession = MOCK_SESSIONS[selectedSessionIndex] || MOCK_SESSIONS[0];

  useEffect(() => {
    if (sheetState !== 'scan_qr_2') return;

    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-camera-viewfinder',
        { fps: 10, qrbox: { width: 220, height: 220 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          scanner.clear();
          if (decodedText.toLowerCase().includes('booth')) {
            if (!claimedStamps.includes('b1')) {
              setClaimedStamps([...claimedStamps, 'b1']);
            }
            setSheetState('booth_profile');
          } else {
            setSheetState('participant_profile');
          }
        },
        (error) => {
          console.warn('QR Camera scan info:', error);
        }
      );

      scannerRef.current = scanner;
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [sheetState, claimedStamps]);

  const handleQuickClaimStamp = (boothId: string) => {
    if (claimedStamps.includes(boothId)) {
      setStampFeedback('Stamp already claimed!');
      return;
    }
    const updated = [...claimedStamps, boothId];
    setClaimedStamps(updated);
    setStampFeedback('Stamp Claimed! +15 Pts');
  };

  // Swipe Down Gesture Handler for Drawer
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
      {/* Mobile Container Viewport */}
      <div className="w-full max-w-md h-full flex flex-col relative shadow-2xl overflow-hidden bg-[#3B9E59]">
        
        {/* TOP SECTION: Green Header */}
        <div className="p-5 pt-6 pb-2 space-y-4 relative shrink-0">
          
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          {/* Header Bar */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
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
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="User Profile"
                className="w-full h-full object-cover"
              />
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
                <button
                  onClick={() => {
                    setSelectedSessionIndex(0);
                    setActiveModal('session');
                  }}
                  className={`w-full text-left bg-[#2B6396] hover:bg-[#255480] text-white text-xs font-medium px-3.5 py-2 rounded-xl truncate shadow-sm transition-all active:scale-98 cursor-pointer ${
                    selectedSessionIndex === 0 ? 'ring-2 ring-white/60' : ''
                  }`}
                >
                  Develop multi agent system with <span className="opacity-75">Agent...</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSessionIndex(1);
                    setActiveModal('session');
                  }}
                  className={`w-full text-left bg-[#3B7A57] hover:bg-[#326749] text-white text-xs font-medium px-3.5 py-2 rounded-xl truncate shadow-sm transition-all active:scale-98 cursor-pointer ${
                    selectedSessionIndex === 1 ? 'ring-2 ring-white/60' : ''
                  }`}
                >
                  From Docker to Docker Compose <span className="opacity-75">Wor...</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSessionIndex(2);
                    setActiveModal('session');
                  }}
                  className={`w-full text-left bg-[#8C4A36] hover:bg-[#773E2D] text-white text-xs font-medium px-3.5 py-2 rounded-xl truncate shadow-sm transition-all active:scale-98 cursor-pointer ${
                    selectedSessionIndex === 2 ? 'ring-2 ring-white/60' : ''
                  }`}
                >
                  Getting Started with MCP, ADK and <span className="opacity-75">A2...</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Grid Icons */}
          <div className="grid grid-cols-4 gap-2 pt-1 pb-2 relative z-10 text-center">
            <button
              onClick={() => setSheetState('scan_qr_1')}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
                <QrScanIcon />
              </div>
              <span className="text-[11px] font-bold text-slate-900">Scan QR</span>
            </button>

            <button
              onClick={() => setActiveModal('rewards')}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
                <GiftIcon />
              </div>
              <span className="text-[11px] font-bold text-slate-900">Rewards</span>
            </button>

            <button
              onClick={() => setActiveModal('faq')}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
                <HelpIcon />
              </div>
              <span className="text-[11px] font-bold text-slate-900">FAQ & Info</span>
            </button>

            <button
              onClick={() => setActiveModal('friends')}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#2A6E3F]/80 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/10 active:scale-95">
                <FriendsNodesIcon />
              </div>
              <span className="text-[11px] font-bold text-slate-900">Friends</span>
            </button>
          </div>
        </div>

        {/* FLUID ANIMATED BOTTOM SHEET DRAWER */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
          initial={false}
          animate={{
            height: isExpanded ? 'calc(100% - 64px)' : 'calc(100% - 365px)',
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="absolute left-0 right-0 bottom-0 bg-[#1C1D21] text-slate-100 rounded-t-[32px] p-5 pt-3 pb-6 border-t border-slate-800 shadow-2xl flex flex-col justify-between z-30 touch-pan-y"
        >
          {/* Top Handle Drag Pill */}
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto shrink-0 mb-2 cursor-grab active:cursor-grabbing"></div>

          {/* ANIMATED CONTENT SWITCHER */}
          <AnimatePresence mode="wait">
            
            {/* STATE 1: HOME SHEET CONTENT */}
            {sheetState === 'home' && (
              <motion.div
                key="home-sheet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-5 overflow-y-auto overscroll-contain scrollbar-none grow flex flex-col justify-between"
              >
                {/* Featured Upcoming Session Card */}
                <div
                  onClick={() => setActiveModal('session')}
                  className="relative bg-[#273C70] rounded-2xl p-5 overflow-hidden shadow-xl border border-blue-900/50 cursor-pointer hover:border-blue-500/50 transition-all active:scale-[0.99] shrink-0"
                >
                  <div className="absolute -top-3 -right-3 z-20 pointer-events-none transform rotate-12">
                    <img src={pinkFlower} alt="Pink Flower" className="w-14 h-14 drop-shadow-lg" />
                  </div>

                  <div className="absolute -bottom-3 -left-3 z-20 pointer-events-none transform -rotate-12">
                    <img src={yellowArrow} alt="Yellow Arrow" className="w-16 h-16 drop-shadow-lg" />
                  </div>

                  <div className="absolute -bottom-3 -right-3 z-20 pointer-events-none transform rotate-6">
                    <img src={greenHashtag} alt="Green Hashtag" className="w-14 h-14 drop-shadow-lg" />
                  </div>

                  <div className="relative z-10 space-y-3 pr-6">
                    <div className="flex items-start gap-3">
                      <img
                        src={activeSession.speaker.avatar}
                        alt={activeSession.speaker.name}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/20 shadow-md"
                      />
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

                {/* Met Someone New? Row */}
                <div className="pt-2 pb-2 border-b border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif italic font-normal text-xl text-white tracking-tight">
                      Met Someone New?
                    </h3>
                    <p className="text-xs text-slate-400 font-sans">
                      Add them as a friend here
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>

                    <button
                      onClick={() => setSheetState('participant_profile')}
                      className="w-12 h-12 rounded-full bg-[#EAE4D9] text-[#1C1D21] flex items-center justify-center shadow-lg hover:scale-105 transition-transform shrink-0 active:scale-95 cursor-pointer"
                    >
                      <FriendsNodesIcon />
                    </button>
                  </div>
                </div>

                {/* Or perhaps lost in the desert...? Row */}
                <div className="pt-1 pb-2 flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-300 font-sans">
                      Or perhaps lost in the desert...?
                    </p>
                    <div className="flex items-center gap-2">
                      <img src={dinoSos} alt="Chrome Dino SOS" className="h-7 object-contain opacity-80" />
                    </div>
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

            {/* STATE 2: SCAN QR 1 (MY QR PASS BADGE) */}
            {sheetState === 'scan_qr_1' && (
              <motion.div
                key="scan-qr-1"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center justify-between grow space-y-4 overflow-y-auto scrollbar-none pt-12 pb-1"
              >
                <div className="relative w-full max-w-[280px] pt-4 my-auto">
                  <div className="absolute -top-3 -left-3 z-10 transform -rotate-12 pointer-events-none">
                    <img src={pinkFlower} alt="Pink Flower" className="w-13 h-13 drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 transform rotate-6 pointer-events-none">
                    <img src={bluePlus} alt="Blue Plus" className="w-14 h-14 drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-4 -right-3 z-10 transform rotate-12 pointer-events-none">
                    <img src={redHeart} alt="Red Heart" className="w-13 h-13 drop-shadow-lg" />
                  </div>

                  {/* Main Pass Card */}
                  <div className="relative bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 shadow-2xl border-4 border-[#DED7C9] text-center space-y-4">
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <span className="font-heading font-black text-lg text-slate-950 tracking-tight">
                        DevFest
                      </span>
                      <span className="bg-[#F7B033] text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-black/10">
                        2026
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-2xl inline-block shadow-inner border border-slate-200">
                      <QRCodeSVG
                        value="DEVFEST-KL-2026-ZIXU-CHEAH-SW"
                        size={170}
                        level="H"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <h2 className="font-heading font-bold text-2xl text-slate-950 tracking-tight">
                        Zixu Cheah
                      </h2>
                      <p className="text-xs font-semibold text-slate-600">
                        Software Engineer
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-300/60">
                      <GdgKlLogo />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="w-full flex items-center justify-center gap-3 pt-2 pb-2">
                  <button
                    onClick={() => setSheetState('scan_qr_2')}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <QrScanIcon />
                    <span>Scan QR</span>
                  </button>

                  <button
                    onClick={() => alert('Saved DevFest KL Pass to your photos/downloads!')}
                    className="w-12 h-12 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
                    aria-label="Download Badge"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE 3: SCAN QR 2 (CAMERA SCANNER MODE) */}
            {sheetState === 'scan_qr_2' && (
              <motion.div
                key="scan-qr-2"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center justify-between grow space-y-4 py-1"
              >
                <div className="w-full grow flex flex-col items-center justify-center space-y-4 my-auto">
                  <div className="w-full max-w-[280px] h-[280px] bg-[#2B2C32] rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl relative flex items-center justify-center">
                    <div id="qr-camera-viewfinder" className="w-full h-full object-cover"></div>

                    {!scanResult && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-3xl flex items-center justify-center">
                        <div className="w-44 h-44 border-2 border-dashed border-white/40 rounded-2xl animate-pulse"></div>
                      </div>
                    )}
                  </div>

                  {/* Demo Previews for Scan Trigger */}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setSheetState('participant_profile')}
                      className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Demo Friend Discovery
                    </button>
                    <button
                      onClick={() => setSheetState('booth_profile')}
                      className="px-3 py-1.5 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 border border-yellow-500/40 text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Demo Booth Discovery
                    </button>
                  </div>

                  <p className="text-xs italic text-slate-400 font-sans tracking-wide">
                    Hold your camera over the QR code
                  </p>
                </div>

                <div className="w-full flex items-center justify-center pt-2 pb-2">
                  <button
                    onClick={() => setSheetState('scan_qr_1')}
                    className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                    aria-label="Back to My QR Pass"
                  >
                    <ArrowLeftIcon />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE 4: PARTICIPANT PROFILE DISCOVERY ("New discovery! You met a new friend.") */}
            {sheetState === 'participant_profile' && (
              <motion.div
                key="participant-profile"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center justify-between grow space-y-4 overflow-y-auto scrollbar-none pt-12 pb-1"
              >
                <div className="relative w-full max-w-[280px] pt-4 my-auto">
                  {/* Pink Flower Sticker (Top Left) */}
                  <div className="absolute -top-3 -left-3 z-20 pointer-events-none transform -rotate-12">
                    <img src={pinkFlower} alt="Pink Flower" className="w-13 h-13 drop-shadow-lg" />
                  </div>

                  {/* Red Heart Sticker (Top Right) */}
                  <div className="absolute -top-4 -right-3 z-20 pointer-events-none transform rotate-12">
                    <img src={redHeart} alt="Red Heart" className="w-13 h-13 drop-shadow-lg" />
                  </div>

                  {/* Blue Plus Sticker (Bottom Right) */}
                  <div className="absolute -bottom-4 -right-3 z-20 pointer-events-none transform rotate-6">
                    <img src={bluePlus} alt="Blue Plus" className="w-13 h-13 drop-shadow-lg" />
                  </div>

                  {/* Main Discovery Card */}
                  <div className="relative bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 shadow-2xl border-4 border-[#DED7C9] text-center space-y-3.5">
                    
                    {/* Header Banner */}
                    <div className="space-y-0.5 pt-1">
                      <h2 className="font-heading font-bold text-2xl text-slate-950 tracking-tight">
                        New discovery!
                      </h2>
                      <p className="text-xs italic text-slate-600 font-serif">
                        You met a new friend.
                      </p>
                    </div>

                    {/* Friend Photo */}
                    <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden border-2 border-slate-800 shadow-md">
                      <img
                        src={discoveredFriend.avatar}
                        alt={discoveredFriend.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Name & Role */}
                    <div className="space-y-0.5">
                      <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight">
                        {discoveredFriend.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">
                        {discoveredFriend.role}
                      </p>
                    </div>

                    {/* Bottom Branding */}
                    <div className="pt-2 border-t border-slate-300/60">
                      <GdgKlLogo />
                    </div>
                  </div>
                </div>

                {/* Bottom Back Action Button */}
                <div className="w-full flex items-center justify-center pt-2 pb-2">
                  <button
                    onClick={() => setSheetState('home')}
                    className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                    aria-label="Back to Home"
                  >
                    <ArrowLeftIcon />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE 5: BOOTH PROFILE DISCOVERY ("New discovery! You visited a booth.") */}
            {sheetState === 'booth_profile' && (
              <motion.div
                key="booth-profile"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center justify-between grow space-y-4 overflow-y-auto scrollbar-none pt-12 pb-1"
              >
                <div className="relative w-full max-w-[280px] pt-4 my-auto">
                  {/* Yellow Star Sticker (Top Left) */}
                  <div className="absolute -top-3 -left-3 z-20 pointer-events-none transform -rotate-12">
                    <img src={yellowStar} alt="Yellow Star" className="w-13 h-13 drop-shadow-lg" />
                  </div>

                  {/* Red Heart Sticker (Top Right) */}
                  <div className="absolute -top-4 -right-3 z-20 pointer-events-none transform rotate-12">
                    <img src={redHeart} alt="Red Heart" className="w-13 h-13 drop-shadow-lg" />
                  </div>

                  {/* Blue Plus Sticker (Bottom Right) */}
                  <div className="absolute -bottom-4 -right-3 z-20 pointer-events-none transform rotate-6">
                    <img src={bluePlus} alt="Blue Plus" className="w-13 h-13 drop-shadow-lg" />
                  </div>

                  {/* Main Discovery Card */}
                  <div className="relative bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 shadow-2xl border-4 border-[#DED7C9] text-center space-y-3.5">
                    
                    {/* Header Banner */}
                    <div className="space-y-0.5 pt-1">
                      <h2 className="font-heading font-bold text-2xl text-slate-950 tracking-tight">
                        New discovery!
                      </h2>
                      <p className="text-xs italic text-slate-600 font-serif">
                        You visited a booth.
                      </p>
                    </div>

                    {/* Booth Logo / Header Mark */}
                    <div className="py-2.5 px-4 bg-white/60 rounded-2xl border border-slate-200/80 inline-block min-w-[170px]">
                      <div className="font-heading font-black text-3xl text-slate-950 tracking-tighter">
                        42<span className="text-[#3B72EF]">KL</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                        Kuala Lumpur | Sunway Education Group
                      </p>
                    </div>

                    {/* Booth Title & Category Tag */}
                    <div className="space-y-0.5">
                      <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight">
                        {discoveredBooth.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">
                        {discoveredBooth.category}
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

                    {/* Bottom Branding */}
                    <div className="pt-2 border-t border-slate-300/60">
                      <GdgKlLogo />
                    </div>
                  </div>
                </div>

                {/* Bottom Back Action Button */}
                <div className="w-full flex items-center justify-center pt-2 pb-2">
                  <button
                    onClick={() => setSheetState('home')}
                    className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                    aria-label="Back to Home"
                  >
                    <ArrowLeftIcon />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* MODALS */}
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card rounded-3xl p-6 border border-slate-800 max-w-sm w-full space-y-4 max-h-[80vh] overflow-y-auto relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-heading font-bold text-base text-white capitalize">
                  {activeModal === 'rewards' && 'DevFest Reward Stamps'}
                  {activeModal === 'faq' && 'FAQ & Venue Info'}
                  {activeModal === 'friends' && 'NFC Bump & Friends'}
                  {activeModal === 'session' && 'Session Details'}
                  {activeModal === 'profile' && 'Attendee Profile'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <CloseIcon />
                </button>
              </div>

              {activeModal === 'rewards' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Collected <strong>{claimedStamps.length}</strong> of {MOCK_BOOTHS.length} booth stamps.
                  </p>
                  <div className="space-y-2">
                    {MOCK_BOOTHS.map((b: Booth) => {
                      const isClaimed = claimedStamps.includes(b.id);
                      return (
                        <div key={b.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{b.name}</span>
                            <span className="text-[10px] text-slate-400">{b.location}</span>
                          </div>
                          {isClaimed ? (
                            <span className="text-emerald-400 font-bold">✓ Stamped</span>
                          ) : (
                            <button
                              onClick={() => handleQuickClaimStamp(b.id)}
                              className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 font-bold rounded-lg text-[11px] cursor-pointer"
                            >
                              Claim Demo
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {stampFeedback && (
                    <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-center">
                      {stampFeedback}
                    </p>
                  )}
                </div>
              )}

              {activeModal === 'faq' && (
                <div className="space-y-3 text-xs">
                  {MOCK_FAQS.map((f: FAQItem, i: number) => (
                    <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <p className="font-bold text-white">{f.question}</p>
                      <p className="text-slate-400 leading-relaxed">{f.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'friends' && (
                <div className="space-y-4 text-center text-xs">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-2">
                    <p className="font-bold text-purple-300">Web NFC Bump Status</p>
                    <p className="text-slate-300">{nfcStatus.message}</p>
                  </div>
                  <p className="text-slate-400">
                    Hold two Android devices back-to-back, or scan another attendee's profile QR code to add as a friend!
                  </p>
                </div>
              )}

              {activeModal === 'session' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={activeSession.speaker.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                    <div>
                      <p className="font-bold text-white text-sm">{activeSession.speaker.name}</p>
                      <p className="text-slate-400 text-[11px]">{activeSession.speaker.role}</p>
                    </div>
                  </div>
                  <p className="font-bold text-blue-400 text-xs">{activeSession.time} • {activeSession.room}</p>
                  <p className="text-slate-300 leading-relaxed">{activeSession.description}</p>
                </div>
              )}

              {activeModal === 'profile' && (
                <div className="space-y-3 text-xs text-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-emerald-500">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Zixu Cheah</h4>
                  <p className="text-slate-400">Software Engineer • zixu.cheah@devfest.kl</p>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-400 font-semibold">
                    ✓ Peatix Ticket Linked
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeScreen;
