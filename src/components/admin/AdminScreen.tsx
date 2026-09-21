import React, { useState } from 'react';
import type { AuthUser } from '../../App';
import AdminStatsSection from './AdminStatsSection';
import AdminOperationsSection from './AdminOperationsSection';
import GdgKlLogo from '../common/GdgKlLogo';

interface AdminScreenProps {
  user: AuthUser | null;
  onBackToApp: () => void;
  onLogout: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  user,
  onBackToApp,
  onLogout,
}) => {
  const [adminTab, setAdminTab] = useState<'statistics' | 'operations'>('statistics');
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const isCoreTeam = user?.ticketType?.toLowerCase() === 'core team';

  // --- ACCESS DENIED SCREEN IF NOT CORE TEAM ---
  if (!isCoreTeam) {
    return (
      <div className="min-h-screen bg-[#0E1015] text-slate-100 flex flex-col items-center justify-center p-6 font-sans select-none">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center text-2xl">
            🔒
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white font-heading">
              Access Denied
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              You don't have permission to access this page.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToApp}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Go Back to DevFest App
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PC-CENTRIC FULL DESKTOP ADMIN SCREEN ---
  return (
    <div className="min-h-screen bg-[#0B0C10] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Desktop Navigation Bar */}
      {!isPresentationMode && (
        <header className="bg-[#12141C] border-b border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-sm">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-white tracking-tight font-heading">
                    DevFest KL 2026 Admin Portal
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                    Core Team
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Operations & Stage Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setAdminTab('statistics')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'statistics'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📊</span>
              <span>Live Statistics</span>
            </button>
            <button
              onClick={() => setAdminTab('operations')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'operations'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚙️</span>
              <span>Event Operations</span>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPresentationMode(true)}
              className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Full screen stage presentation view"
            >
              <span>📺</span>
              <span>Audience Display</span>
            </button>

            <button
              onClick={onBackToApp}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>📱</span>
              <span>Attendee App</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Sign out"
            >
              Sign Out
            </button>
          </div>
        </header>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {adminTab === 'statistics' && (
          <AdminStatsSection
            isPresentationMode={isPresentationMode}
            onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
          />
        )}

        {adminTab === 'operations' && <AdminOperationsSection />}
      </main>

      {/* Footer */}
      {!isPresentationMode && (
        <footer className="border-t border-slate-800/80 bg-[#12141C] py-4 px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GdgKlLogo inverted />
            <span>Google Developer Group Kuala Lumpur • DevFest 2026 Admin Portal</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Authorized: {user?.email} • ticket_type: "Core Team"
          </div>
        </footer>
      )}
    </div>
  );
};

export default AdminScreen;
