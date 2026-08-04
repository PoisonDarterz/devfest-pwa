import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Sparkles, Ticket, QrCode, Bell, Users, HelpCircle, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const featureStack = [
    {
      title: 'Google Sign-In & Peatix Ticket Check-In',
      description: 'Match participant emails with Peatix attendee lists & display secure QR code for gate scanning.',
      icon: Ticket,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Web Push Event Notifications',
      description: 'Push real-time alerts for starting speaker sessions & lucky draw announcements (Android & iOS PWA).',
      icon: Bell,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20'
    },
    {
      title: 'QR Booth Visit Passport',
      description: 'Gamified QR stamp collection at sponsor & community booths to qualify for lucky draw prizes.',
      icon: QrCode,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20'
    },
    {
      title: 'NFC Phone Bump & Profile Swap',
      description: 'Peer-to-peer contact swap using Web NFC on Android and Contact QR / Share link fallback on iOS.',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Offline FAQ & Event Info Deck',
      description: 'Workbox PWA cached static pages for venue navigation (KLCC), LRT/MRT guide & Code of Conduct.',
      icon: HelpCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
              <div className="grid grid-cols-2 gap-1 p-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              </div>
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-lg text-white tracking-tight">
                DevFest <span className="text-blue-400">KL</span> 2026
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                PWA Core Boilerplate Ready
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'PWA Online' : 'PWA Offline'}</span>
          </div>
        </div>
      </header>

      {/* Main Hero Placeholder Content */}
      <main className="grow max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Google Developer Group Kuala Lumpur
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              DevFest KL 2026 Companion PWA
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Boilerplate foundation initialized with Vite, React, TypeScript, Tailwind CSS, PWA Service Worker caching, and Supabase integration logic.
            </p>
          </div>
        </div>

        {/* Feature Roadmap List */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg text-white flex items-center justify-between">
            <span>Planned Feature Modules</span>
            <span className="text-xs text-slate-500 font-normal">Ready for Figma Integration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureStack.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-4"
                >
                  <div className={`p-3 rounded-xl border shrink-0 ${feat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${feat.color}`} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-heading font-bold text-sm text-white">
                      {feat.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech Stack Info Footer Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">Tech Stack:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-blue-400 font-mono">Vite 6</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono">React + TS</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-teal-400 font-mono">Tailwind v4</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono">Supabase</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-purple-400 font-mono">Workbox PWA</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <span>Awaiting Figma designs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
