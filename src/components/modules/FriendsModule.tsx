import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pinkFlower from '../../assets/pink-flower.svg';
import bluePlus from '../../assets/blue-plus.svg';
import redHeart from '../../assets/red-heart.svg';

export interface FriendConnection {
  id: string;
  name: string;
  displayName: string;
  role: string;
  bio: string;
  avatar?: string;
  photoUrl?: string;
  initials: string;
  color: string;
  githubUrl?: string;
  linkedinUrl?: string;
  email?: string;
}

interface FriendsModuleProps {
  onBackToHome: () => void;
  onOpenQrOrNfc: () => void;
  initialSelectedFriend?: FriendConnection | null;
  friends?: FriendConnection[];
  isLoading?: boolean;
}

// Initial default connections list (matching the 15 connections count from mockup)
export const DEFAULT_FRIENDS: FriendConnection[] = [
  {
    id: 'f-1',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Computer Science Student',
    bio: 'CS undergrad passionate about full-stack web development and open-source tooling. Always down to talk system architecture, hackathon ideas, or the best coffee nearby.',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
    email: 'zixu.cheah@devfest.kl',
  },
  {
    id: 'f-2',
    name: 'Jonas Chuan',
    displayName: 'Jonas C.',
    role: 'Application Support & Integration Engineer',
    bio: 'Building Android apps & PWAs. Passionate about Kotlin, Flutter, and web performance! Core Team @ GDGKL.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    initials: 'JC',
    color: 'bg-[#2D6E66]',
    linkedinUrl: 'https://www.linkedin.com/in/jonas-chuan-407929242/',
    githubUrl: 'https://github.com/PoisonDarterz',
    email: 'jonas.chuan@devfest.kl',
  },
  {
    id: 'f-3',
    name: 'Jun Yi',
    displayName: 'Jun Yi',
    role: 'Frontend Developer',
    bio: 'UI/UX enthusiast and React developer. Passionate about slick micro-interactions and accessible animations.',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    initials: 'JY',
    color: 'bg-[#7A662E]',
    linkedinUrl: 'https://linkedin.com/in/junyi',
    githubUrl: 'https://github.com/junyi',
    email: 'junyi@devfest.kl',
  },
  {
    id: 'f-4',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Backend Engineer',
    bio: 'Distributed systems tinkerer, Go enthusiast, and Kubernetes explorer.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-5',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'AI / ML Engineer',
    bio: 'Building agentic AI tools with Gemini, Python, and PyTorch.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-6',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Cloud Architect',
    bio: 'GCP certified professional, terraform lover, and serverless enthusiast.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-7',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Mobile Developer',
    bio: 'Flutter and Dart fan building cross-platform mobile apps.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-8',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'DevOps Engineer',
    bio: 'Automating pipelines with GitHub Actions and Docker containers.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-9',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Product Designer',
    bio: 'Designing intuitive experiences and design systems in Figma.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-10',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Full Stack Developer',
    bio: 'TypeScript, Next.js, Node.js and PostgreSQL enthusiast.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-11',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Cybersecurity Analyst',
    bio: 'Passionate about web security, OWASP, and ethical hacking.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-12',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Open Source Contributor',
    bio: 'Active contributor to developer tooling and community libraries.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-13',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Data Scientist',
    bio: 'Transforming complex datasets into actionable business intelligence.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-14',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Tech Lead',
    bio: 'Mentoring engineers and scaling engineering culture.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
  {
    id: 'f-15',
    name: 'Zixu Cheah',
    displayName: 'Zixu C.',
    role: 'Community Lead',
    bio: 'Fostering tech community events and hackathons across KL.',
    initials: 'ZC',
    color: 'bg-[#2A3A68]',
    linkedinUrl: 'https://linkedin.com/in/zixucheah331',
    githubUrl: 'https://github.com/zixucheah331',
  },
];

// Helper to extract clean handle from URL
const extractHandle = (url?: string, defaultHandle = ''): string => {
  if (!url) return defaultHandle;
  const trimmed = url.replace(/\/+$/, '');
  const parts = trimmed.split('/');
  return parts[parts.length - 1] || defaultHandle;
};

// High-five / Clapping hands SVG matching DevFest green stroke aesthetic
const HighFiveIcon = () => (
  <svg
    className="w-16 h-16 text-[#2E9E5B] mx-auto"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 3 Radiating Energy / Clap Lines */}
    <path d="M30 14L26 7" stroke="#2E9E5B" strokeWidth="3" strokeLinecap="round" />
    <path d="M40 12L40 4" stroke="#2E9E5B" strokeWidth="3" strokeLinecap="round" />
    <path d="M50 14L54 7" stroke="#2E9E5B" strokeWidth="3" strokeLinecap="round" />

    {/* Left Hand: Fingers and Palm */}
    <path
      d="M26 62L26 48C26 43 29 37 34 33L38 29C39.2 28 40.8 28.6 40.8 30.2L40.8 45"
      stroke="#2E9E5B"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 62L19 46C19 41 22 36 26 33L31 29"
      stroke="#2E9E5B"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 62L29 62"
      stroke="#2E9E5B"
      strokeWidth="3.2"
      strokeLinecap="round"
    />

    {/* Right Hand: Fingers and Palm (Mirrored) */}
    <path
      d="M54 62L54 48C54 43 51 37 46 33L42 29C40.8 28 39.2 28.6 39.2 30.2L39.2 45"
      stroke="#2E9E5B"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M61 62L61 46C61 41 58 36 54 33L49 29"
      stroke="#2E9E5B"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M51 62L64 62"
      stroke="#2E9E5B"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const QrIcon = () => (
  <svg className="w-4 h-4 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3h-3z" />
    <path d="M19 19h2" />
    <path d="M19 14v2" />
    <path d="M14 19v2h3" />
  </svg>
);

export const FriendsModule: React.FC<FriendsModuleProps> = ({
  onBackToHome,
  onOpenQrOrNfc,
  initialSelectedFriend,
  friends = DEFAULT_FRIENDS,
  isLoading = false,
}) => {
  const [selectedFriend, setSelectedFriend] = useState<FriendConnection | null>(
    initialSelectedFriend || null
  );

  // Sync selected friend if passed from parent (e.g. newly scanned friend)
  React.useEffect(() => {
    if (initialSelectedFriend) {
      setSelectedFriend(initialSelectedFriend);
    }
  }, [initialSelectedFriend]);

  return (
    <motion.div
      key="friends-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full w-full relative text-slate-900 overflow-hidden"
    >
      {/* Top Header Bar: Clean Close Control */}
      <div className="flex items-center justify-end px-3 pt-1 pb-2 shrink-0">
        <button
          type="button"
          onClick={onBackToHome}
          className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Close Friends"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Cream Rounded Card Container */}
      <div className="grow bg-[#ECE6DA] rounded-t-[32px] flex flex-col relative overflow-hidden shadow-xl border border-slate-300/40">
        {/* Scrollable Friends Content */}
        <div className="grow overflow-y-auto px-5 pt-5 pb-24 scrollbar-none space-y-4">
          {/* Top High-Five Clapping Hands Graphic */}
          <div className="flex justify-center pt-1">
            <HighFiveIcon />
          </div>

          {/* Connections Counter Text */}
          <div className="text-center font-serif italic text-slate-700 text-sm flex items-center justify-center gap-1.5 select-none">
            <span>You now have</span>
            <span className="inline-flex items-center justify-center bg-[#DFD9CE] text-slate-900 font-sans font-extrabold text-base px-3 py-0.5 rounded-xl shadow-inner border border-black/5">
              {friends.length}
            </span>
            <span>new connections.</span>
          </div>

          {/* Loading Indicator */}
          {isLoading && friends.length === 0 && (
            <div className="py-12 text-center text-slate-500 font-medium text-xs">
              Loading your DevFest connections...
            </div>
          )}

          {/* Empty State */}
          {!isLoading && friends.length === 0 && (
            <div className="py-8 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 mx-auto flex items-center justify-center text-xl shadow-sm">
                🤝
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-slate-900">No connections yet</p>
                <p className="text-[11.5px] text-slate-600 leading-relaxed max-w-[260px] mx-auto font-sans">
                  Tap the button below to bump phones with NFC or scan attendee badge QR codes to expand your network!
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenQrOrNfc}
                className="mt-2 inline-flex items-center gap-2 bg-[#2D6E66] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#255C55] transition-all cursor-pointer"
              >
                <QrIcon />
                <span>Start Connecting</span>
              </button>
            </div>
          )}

          {/* 3-Column Friends Grid */}
          {friends.length > 0 && (
            <div className="grid grid-cols-3 gap-y-5 gap-x-3 pt-3">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => setSelectedFriend(friend)}
                  className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform text-center"
                >
                  {/* Circular Avatar / Initials Circle */}
                  <div
                    className={`w-14 h-14 rounded-full ${friend.color} text-white font-bold text-base flex items-center justify-center shadow-md border-2 border-white/20 group-hover:scale-105 transition-all overflow-hidden`}
                  >
                    {friend.initials}
                  </div>

                  {/* Friend Display Name */}
                  <span className="text-[12px] font-medium text-slate-800 tracking-tight mt-1.5 truncate max-w-[85px] leading-tight group-hover:text-slate-950">
                    {friend.displayName || friend.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Floating Gradient Bottom Overlay with Action Pill */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#ECE6DA] via-[#ECE6DA]/90 to-transparent pointer-events-none flex items-center justify-center pb-3">
          <button
            type="button"
            onClick={onOpenQrOrNfc}
            className="pointer-events-auto bg-[#ECE6DA] hover:bg-[#F2ECE1] text-slate-900 border-2 border-slate-700/60 rounded-full px-6 py-2.5 shadow-xl flex items-center gap-2.5 font-bold text-xs tracking-tight transition-all active:scale-95 cursor-pointer"
          >
            <QrIcon />
            <span>Friend QR Code / NFC Bump</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* FRIEND DETAILS MODAL OVERLAY (RIGHT VIEW IN MOCKUP)               */}
      {/* ================================================================= */}
      <AnimatePresence>
        {selectedFriend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
            {/* Backdrop click to dismiss */}
            <div
              className="absolute inset-0"
              onClick={() => setSelectedFriend(null)}
            />

            {/* Friend Details Card with Stickers */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative w-full max-w-[320px] z-10 select-none"
            >
              {/* STICKERS POPPING OUT OF THE CARD */}
              {/* Top-Right Red Heart Sticker */}
              <div className="absolute -top-6 -right-5 z-20 pointer-events-none transform rotate-12 drop-shadow-lg">
                <img src={redHeart} alt="Heart Sticker" className="w-14 h-14" />
              </div>

              {/* Middle-Left Pink Flower Sticker */}
              <div className="absolute top-14 -left-6 z-20 pointer-events-none transform -rotate-12 drop-shadow-lg">
                <img src={pinkFlower} alt="Flower Sticker" className="w-13 h-13" />
              </div>

              {/* Bottom-Right Blue Plus Sticker */}
              <div className="absolute -bottom-6 -right-5 z-20 pointer-events-none transform rotate-6 drop-shadow-lg">
                <img src={bluePlus} alt="Plus Sticker" className="w-15 h-15" />
              </div>

              {/* Outer Card Frame */}
              <div className="bg-[#ECE6DA] text-slate-900 rounded-[30px] p-3 shadow-2xl border-2 border-slate-900 relative overflow-hidden">
                {/* Close Button on Top Right */}
                <button
                  type="button"
                  onClick={() => setSelectedFriend(null)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer z-10"
                  aria-label="Close details"
                >
                  ✕
                </button>

                {/* Inner Double-Border Inset Container */}
                <div className="border border-slate-400/50 rounded-[22px] p-4.5 flex flex-col items-center text-center">
                  {/* Friend Photo / Avatar Frame */}
                  <div className="w-full max-w-[210px] aspect-square rounded-2xl overflow-hidden border-2 border-slate-900 shadow-sm bg-slate-200 relative mb-3">
                    {selectedFriend.photoUrl ? (
                      <img
                        src={selectedFriend.photoUrl}
                        alt={selectedFriend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center text-white ${selectedFriend.color}`}
                      >
                        <span className="text-4xl font-extrabold tracking-wider">
                          {selectedFriend.initials}
                        </span>
                        <span className="text-[10px] font-mono mt-1 opacity-70 uppercase tracking-widest">
                          DevFest 2026
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Friend Full Name */}
                  <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight leading-tight">
                    {selectedFriend.name}
                  </h3>

                  {/* Role / Subtitle */}
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {selectedFriend.role}
                  </p>

                  {/* Bio in Italic Serif */}
                  {selectedFriend.bio && (
                    <p className="text-[12px] text-slate-700 italic leading-relaxed font-serif px-1 mt-3 mb-4">
                      "{selectedFriend.bio}"
                    </p>
                  )}

                  {/* Social Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-0.5">
                    {selectedFriend.linkedinUrl && (
                      <a
                        href={selectedFriend.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0A66C2] hover:bg-[#084e96] text-white text-[11px] font-bold shadow-sm transition-all active:scale-95"
                      >
                        <LinkedinIcon />
                        <span>{extractHandle(selectedFriend.linkedinUrl, 'LinkedIn')}</span>
                      </a>
                    )}

                    {selectedFriend.githubUrl && (
                      <a
                        href={selectedFriend.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#24292E] hover:bg-[#1b1f23] text-white text-[11px] font-bold shadow-sm transition-all active:scale-95"
                      >
                        <GithubIcon />
                        <span>{extractHandle(selectedFriend.githubUrl, 'GitHub')}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FriendsModule;
