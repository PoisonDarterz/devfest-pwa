import React, { useState, useMemo } from 'react';
import type { Session } from '../../lib/types';
import { CloseIcon } from '../common/Icons';

interface FullScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  savedSessionIds: string[];
  onToggleSaveSession: (sessionId: string) => void;
  onSelectSessionDetail?: (session: Session) => void;
}

type TrackFilter = 'All' | 'AI / ML' | 'Cloud & DevOps' | 'Mobile & Web' | 'Saved';

export const FullScheduleModal: React.FC<FullScheduleModalProps> = ({
  isOpen,
  onClose,
  sessions,
  savedSessionIds,
  onToggleSaveSession,
  onSelectSessionDetail,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<TrackFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Parse time helper for chronological sorting
  const parseSessionTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(' ');
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    const [hStr, mStr] = time.split(':');
    let hours = parseInt(hStr, 10) || 0;
    const minutes = parseInt(mStr, 10) || 0;
    if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const getTrackColorBadge = (track: string) => {
    if (track === 'AI / ML' || track === 'Keynote') {
      return 'bg-[#2B6396]/20 text-[#60A5FA] border-[#2B6396]/40';
    }
    if (track === 'Cloud & DevOps') {
      return 'bg-[#3B7A57]/20 text-[#4ADE80] border-[#3B7A57]/40';
    }
    return 'bg-[#8C4A36]/20 text-[#FB923C] border-[#8C4A36]/40';
  };

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        // Track filter
        if (selectedTrack === 'Saved') {
          if (!savedSessionIds.includes(s.id)) return false;
        } else if (selectedTrack === 'AI / ML') {
          if (s.track !== 'AI / ML' && s.track !== 'Keynote') return false;
        } else if (selectedTrack === 'Cloud & DevOps') {
          if (s.track !== 'Cloud & DevOps') return false;
        } else if (selectedTrack === 'Mobile & Web') {
          if (s.track !== 'Mobile & Flutter' && s.track !== 'Web & Chrome') return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchSpeaker = s.speaker.name.toLowerCase().includes(q);
          const matchRoom = s.room.toLowerCase().includes(q);
          const matchDesc = s.description.toLowerCase().includes(q);
          return matchTitle || matchSpeaker || matchRoom || matchDesc;
        }

        return true;
      })
      .sort((a, b) => parseSessionTimeToMinutes(a.time) - parseSessionTimeToMinutes(b.time));
  }, [sessions, selectedTrack, searchQuery, savedSessionIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#181A20] text-slate-100 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 shrink-0 bg-[#1C1E26]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg">
              📅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                  Full Event Schedule
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  DevFest 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {sessions.length} sessions across all 3 conference tracks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close schedule dialog"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Filters & Search Controls */}
        <div className="p-4 border-b border-slate-800/60 bg-[#15171C] space-y-3 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search sessions, topics, speakers, or rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 text-xs text-white placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Track Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 text-xs">
            {(
              [
                { id: 'All', label: 'All Tracks' },
                { id: 'AI / ML', label: 'Track 1 (AI / ML)' },
                { id: 'Cloud & DevOps', label: 'Track 2 (Cloud)' },
                { id: 'Mobile & Web', label: 'Track 3 (Mobile & Web)' },
                { id: 'Saved', label: `★ Saved (${savedSessionIds.length})` },
              ] as const
            ).map((filter) => {
              const isActive = selectedTrack === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedTrack(filter.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 grow scrollbar-thin">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-3xl block">🔍</span>
              <p className="text-sm font-semibold text-slate-300">No sessions match your filter</p>
              <p className="text-xs text-slate-500">
                {selectedTrack === 'Saved'
                  ? "You haven't bookmarked any sessions yet. Click the bookmark icon on any session to save it!"
                  : 'Try searching with different keywords or switch track filters.'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSaved = savedSessionIds.includes(session.id);
              const trackBadgeStyle = getTrackColorBadge(session.track);

              return (
                <div
                  key={session.id}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 transition-all duration-150 shadow-sm flex flex-col gap-3 group"
                >
                  {/* Top Meta: Time, Room, Track */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-black/40 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
                        {session.time}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">•</span>
                      <span className="text-slate-300 text-xs font-medium">{session.room}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${trackBadgeStyle}`}
                      >
                        {session.track}
                      </span>
                      {typeof session.rsvpCount === 'number' && session.rsvpCount > 0 && (
                        <span className="text-[10px] font-mono font-bold text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          🔥 {session.rsvpCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Session Title & Description */}
                  <div className="space-y-1.5">
                    <h3
                      onClick={() => onSelectSessionDetail?.(session)}
                      className="font-bold text-white text-sm sm:text-base leading-snug group-hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      {session.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed font-sans">
                      {session.description}
                    </p>
                  </div>

                  {/* Speaker & Action Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={session.speaker.avatar}
                        alt={session.speaker.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {session.speaker.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {session.speaker.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onSelectSessionDetail && (
                        <button
                          onClick={() => onSelectSessionDetail(session)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      )}

                      <button
                        onClick={() => onToggleSaveSession(session.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                        title={isSaved ? 'Remove from saved' : 'RSVP & Save session'}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill={isSaved ? 'currentColor' : 'none'}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {isSaved ? 'Saved' : 'RSVP'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 px-5 bg-[#14151A] border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>💡 Tap <strong>RSVP</strong> to get 5-minute pre-session reminders</span>
          <span className="font-mono text-slate-500">{filteredSessions.length} listed</span>
        </div>
      </div>
    </div>
  );
};

export default FullScheduleModal;
