import React from 'react';
import type { Session } from '../../lib/types';

interface OngoingSessionsRailProps {
  sessions: Session[];
  savedSessionIds: string[];
  selectedSessionIndex: number;
  isTracklistExpanded: boolean;
  onToggleExpand: () => void;
  onSelectSession: (index: number) => void;
  onOpenFullSchedule?: () => void;
}

export const OngoingSessionsRail: React.FC<OngoingSessionsRailProps> = ({
  sessions,
  savedSessionIds,
  selectedSessionIndex,
  isTracklistExpanded,
  onToggleExpand,
  onSelectSession,
  onOpenFullSchedule,
}) => {
  const track1Sessions = sessions.filter((s) => s.track === 'AI / ML' || s.track === 'Keynote');
  const track2Sessions = sessions.filter((s) => s.track === 'Cloud & DevOps');
  const track3Sessions = sessions.filter(
    (s) => s.track === 'Mobile & Flutter' || s.track === 'Web & Chrome'
  );

  const renderSessionCard = (sess: Session, bgColor: string) => {
    const isSaved = savedSessionIds.includes(sess.id);
    const isSelected = sessions[selectedSessionIndex]?.id === sess.id;
    const sessionIdx = sessions.findIndex((s) => s.id === sess.id);

    return (
      <button
        key={sess.id}
        onClick={() => onSelectSession(sessionIdx !== -1 ? sessionIdx : 0)}
        className={`text-left ${bgColor} text-white text-xs font-medium px-3.5 rounded-xl shadow-sm transition-all active:scale-98 cursor-pointer flex items-center justify-between shrink-0 snap-start ${
          isTracklistExpanded ? 'w-[230px] py-2.5' : 'w-[170px] py-2'
        } ${isSelected ? 'ring-2 ring-white/60' : ''}`}
      >
        {isTracklistExpanded ? (
          <div className="flex flex-col gap-0.5 grow pr-2 min-w-0">
            <span className="font-extrabold text-[11px] leading-tight text-white whitespace-normal break-words">
              {sess.title}
            </span>
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

  return (
    <div className="space-y-2 relative z-10">
      <div className="flex items-center justify-between select-none">
        {/* Expand / Collapse Tracklist Toggle */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded-xl hover:bg-black/10 active:scale-95 transition-all text-slate-900 cursor-pointer group"
          aria-expanded={isTracklistExpanded}
          title={isTracklistExpanded ? 'Collapse session details' : 'Expand session details'}
        >
          <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono">
            ONGOING SESSIONS
          </span>
          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900/15 text-slate-900 group-hover:bg-slate-900/25 transition-colors">
            {isTracklistExpanded ? 'Less' : 'Expand'}
            <svg
              className={`w-3 h-3 transform transition-transform duration-200 ${
                isTracklistExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {/* Show Full Schedule Prompt */}
        <button
          type="button"
          onClick={onOpenFullSchedule}
          className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-950 bg-white/40 hover:bg-white/60 active:scale-95 px-2.5 py-1 rounded-xl transition-all shadow-xs border border-white/50 backdrop-blur-xs cursor-pointer group"
          title="Open complete conference schedule"
        >
          <svg
            className="w-3 h-3 text-slate-900 group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Full Schedule</span>
          <svg
            className="w-2.5 h-2.5 text-slate-800/80 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 pt-1">
        {/* Row for Track 1 */}
        <div className="flex gap-2.5 items-center">
          <span className="text-[10px] font-extrabold text-slate-900/90 border-l-2 border-slate-900/80 pl-2 shrink-0 w-12 uppercase tracking-wider font-mono">
            Track 1
          </span>
          <div className="grow flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pr-1 py-0.5">
            {track1Sessions.map((sess) => renderSessionCard(sess, 'bg-[#2B6396] hover:bg-[#255480]'))}
          </div>
        </div>

        {/* Row for Track 2 */}
        <div className="flex gap-2.5 items-center">
          <span className="text-[10px] font-extrabold text-slate-900/90 border-l-2 border-slate-900/80 pl-2 shrink-0 w-12 uppercase tracking-wider font-mono">
            Track 2
          </span>
          <div className="grow flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pr-1 py-0.5">
            {track2Sessions.map((sess) => renderSessionCard(sess, 'bg-[#3B7A57] hover:bg-[#326749]'))}
          </div>
        </div>

        {/* Row for Track 3 */}
        <div className="flex gap-2.5 items-center">
          <span className="text-[10px] font-extrabold text-slate-900/90 border-l-2 border-slate-900/80 pl-2 shrink-0 w-12 uppercase tracking-wider font-mono">
            Track 3
          </span>
          <div className="grow flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pr-1 py-0.5">
            {track3Sessions.map((sess) => renderSessionCard(sess, 'bg-[#8C4A36] hover:bg-[#773E2D]'))}
          </div>
        </div>
      </div>
    </div>
  );
};
