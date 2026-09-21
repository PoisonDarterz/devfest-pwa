import React, { useState, useEffect } from 'react';
import type { AdminStats } from '../../services/adminService';
import adminService from '../../services/adminService';

interface AdminStatsSectionProps {
  isPresentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const AdminStatsSection: React.FC<AdminStatsSectionProps> = ({
  isPresentationMode,
  onTogglePresentationMode,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await adminService.getAdminStats();
      setStats(data);
    } catch (err) {
      console.warn('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-poll stats every 12 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading live conference analytics...</p>
      </div>
    );
  }

  if (!stats) return null;

  const checkInRate = Math.round((stats.checkedInUsers / (stats.totalUsers || 1)) * 100);
  const nfcPct = Math.round((stats.nfcConnectionsCount / (stats.totalConnections || 1)) * 100);
  const qrPct = 100 - nfcPct;

  // PRESENTATION / AUDIENCE BIG SCREEN MODE
  if (isPresentationMode) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Presentation Stage Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-blue-950/60 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Stage Engagement Pulse
              </span>
              <span className="text-xs text-slate-400 font-mono">Updated {stats.lastUpdated}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              Google DevFest Kuala Lumpur 2026
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Real-time attendee networking, interactive booth quests, and technical sessions.
            </p>
          </div>

          <button
            onClick={onTogglePresentationMode}
            className="relative z-10 px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition-all"
          >
            ✕ Exit Stage Mode
          </button>
        </div>

        {/* 4 Huge Stage KPI Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1: Total Users */}
          <div className="bg-slate-900/90 border-2 border-emerald-500/30 rounded-3xl p-7 text-center space-y-2 shadow-xl hover:border-emerald-500/60 transition-all">
            <span className="text-4xl block">👥</span>
            <p className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
              Active Attendees
            </p>
            <p className="text-5xl sm:text-6xl font-black text-white font-heading">
              {stats.totalUsers}
            </p>
            <p className="text-xs text-emerald-400 font-semibold">
              {stats.checkedInUsers} checked in ({checkInRate}%)
            </p>
          </div>

          {/* Stat 2: Total Connections */}
          <div className="bg-slate-900/90 border-2 border-blue-500/30 rounded-3xl p-7 text-center space-y-2 shadow-xl hover:border-blue-500/60 transition-all">
            <span className="text-4xl block">🤝</span>
            <p className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
              Connections Made
            </p>
            <p className="text-5xl sm:text-6xl font-black text-blue-400 font-heading">
              {stats.totalConnections}
            </p>
            <p className="text-xs text-blue-300/80 font-semibold">
              Via NFC Phone Bump & QR
            </p>
          </div>

          {/* Stat 3: Completed Stamps */}
          <div className="bg-slate-900/90 border-2 border-amber-500/30 rounded-3xl p-7 text-center space-y-2 shadow-xl hover:border-amber-500/60 transition-all">
            <span className="text-4xl block">🎁</span>
            <p className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
              Stamp Cards Completed
            </p>
            <p className="text-5xl sm:text-6xl font-black text-amber-400 font-heading">
              {stats.completedStampCards}
            </p>
            <p className="text-xs text-amber-300/80 font-semibold">
              Eligible for Blind Box Gacha
            </p>
          </div>

          {/* Stat 4: Total RSVPs */}
          <div className="bg-slate-900/90 border-2 border-purple-500/30 rounded-3xl p-7 text-center space-y-2 shadow-xl hover:border-purple-500/60 transition-all">
            <span className="text-4xl block">🔥</span>
            <p className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
              Session RSVPs
            </p>
            <p className="text-5xl sm:text-6xl font-black text-purple-400 font-heading">
              {stats.totalRsvps}
            </p>
            <p className="text-xs text-purple-300/80 font-semibold">
              Across 3 Stage Tracks
            </p>
          </div>
        </div>

        {/* Stage Content: Leaderboard & Most Popular Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Networkers */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <h3 className="font-bold text-lg text-white font-heading">
                  Top Networkers Leaderboard
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Most Connected
              </span>
            </div>

            <div className="space-y-3">
              {stats.topNetworkers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        user.rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                          : user.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : user.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {user.rank}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-emerald-400">
                      {user.connectionCount}
                    </span>
                    <span className="text-[10px] text-slate-400 block">friends connected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Popular Sessions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h3 className="font-bold text-lg text-white font-heading">
                  Most Anticipated Sessions
                </h3>
              </div>
              <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Top RSVPs
              </span>
            </div>

            <div className="space-y-3">
              {stats.topSessions.slice(0, 4).map((sess, idx) => (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                      #{idx + 1} • {sess.time}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      🔥 {sess.rsvpCount} RSVPs
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm leading-snug">{sess.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{sess.speakerName}</span>
                    <span>•</span>
                    <span className="text-slate-300">{sess.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD ORGANIZER DESKTOP DASHBOARD
  return (
    <div className="space-y-6">
      {/* Action Header & Quick Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-heading flex items-center gap-2">
            <span>Conference Engagement & Live Statistics</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-400">
            Real-time analytics aggregated from Supabase database. Last synced: {stats.lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Stats'}</span>
          </button>

          <button
            onClick={onTogglePresentationMode}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
          >
            <span>📺</span>
            <span>Audience Presentation View</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-400">Attendees</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm">👥</span>
          </div>
          <div>
            <div className="text-3xl font-black text-white font-heading">{stats.totalUsers}</div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
              <span>Checked in: {stats.checkedInUsers}</span>
              <span className="text-emerald-400 font-bold">{checkInRate}%</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${checkInRate}%` }}
            />
          </div>
        </div>

        {/* Card 2: Connections */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-400">Total Connections</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 text-sm">🤝</span>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-400 font-heading">{stats.totalConnections}</div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
              <span>NFC: {stats.nfcConnectionsCount}</span>
              <span>QR: {stats.qrConnectionsCount}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500" style={{ width: `${nfcPct}%` }} title="NFC Bump" />
            <div className="h-full bg-cyan-400" style={{ width: `${qrPct}%` }} title="QR Scan" />
          </div>
        </div>

        {/* Card 3: Completed Stamp Cards */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-400">Completed Stamps</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-sm">🎯</span>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-400 font-heading">{stats.completedStampCards}</div>
            <p className="text-xs text-slate-400 mt-1">
              {Math.round((stats.completedStampCards / (stats.totalUsers || 1)) * 100)}% of attendees completed cards
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((stats.completedStampCards / (stats.totalUsers || 1)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Card 4: Total RSVPs */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-400">Total RSVPs</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-sm">🔖</span>
          </div>
          <div>
            <div className="text-3xl font-black text-purple-400 font-heading">{stats.totalRsvps}</div>
            <p className="text-xs text-slate-400 mt-1">
              Avg {(stats.totalRsvps / (stats.totalUsers || 1)).toFixed(1)} sessions saved / attendee
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 transition-all duration-500 w-[72%]" />
          </div>
        </div>
      </div>

      {/* Detailed Multi-Column Desktop Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Top Networkers Leaderboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>🏆 Top Networkers</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Ranked by connections</span>
          </div>

          <div className="space-y-2.5">
            {stats.topNetworkers.map((networker) => (
              <div
                key={networker.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      networker.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : networker.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : networker.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {networker.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{networker.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{networker.role}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-emerald-400 shrink-0 ml-2">
                  {networker.connectionCount} contacts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Most Popular Sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>🔥 Top RSVP Sessions</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">3 Tracks</span>
          </div>

          <div className="space-y-2.5">
            {stats.topSessions.slice(0, 5).map((sess) => (
              <div
                key={sess.id}
                className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 space-y-1 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-slate-400 font-mono">{sess.time} • {sess.room}</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {sess.rsvpCount} RSVPs
                  </span>
                </div>
                <p className="text-xs font-bold text-white truncate">{sess.title}</p>
                <p className="text-[10px] text-slate-400">{sess.speakerName} ({sess.track})</p>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Booth Traffic & Stamp Quests */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>🎪 Booth Stamp Activity</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Hall A & B</span>
          </div>

          <div className="space-y-2.5">
            {stats.boothTraffic.map((booth) => (
              <div
                key={booth.id}
                className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-white truncate">{booth.name}</p>
                  <p className="text-[10px] text-slate-400">{booth.location} • {booth.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-xs text-blue-400">
                    {booth.stampCount}
                  </span>
                  <span className="text-[9px] text-slate-500 block">stamps given</span>
                </div>
              </div>
            ))}
          </div>

          {/* Networking Mode Ratio Indicator */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Connection Tech Breakdown</span>
              <span>{nfcPct}% NFC • {qrPct}% QR</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-500" style={{ width: `${nfcPct}%` }} />
              <div className="h-full bg-emerald-400" style={{ width: `${qrPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsSection;
