import React from 'react';
import gdgklLogo from '../../assets/GDGKL-logo.png';
import mapSvg from '../../assets/map.svg';
import faqSvg from '../../assets/faq.svg';
import gdgBwSvg from '../../assets/gdg-bw.svg';
import { CloseIcon } from '../common/Icons';
import { getAvatarUrl } from '../../lib/avatar';
import GdgKlLogo from '../common/GdgKlLogo';
import type { Booth, FAQItem, Session } from '../../lib/types';

interface InfoModalsProps {
  activeModal: 'rewards' | 'faq' | 'venue_map' | 'about_gdg' | 'friends' | 'session' | 'profile' | null;
  booths: Booth[];
  faqs: FAQItem[];
  claimedStamps: string[];
  stampFeedback: string | null;
  nfcMessage: string;
  activeSession: Session;
  userProfile: {
    name: string;
    role: string;
    email: string;
    avatar: string;
  };
  onClaimStampDemo: (boothId: string) => void;
  onClose: () => void;
  savedSessionIds?: string[];
  onToggleSaveSession?: (sessionId: string) => void;
  onSimulateAlert?: (session: Session) => void;
}

export const InfoModals: React.FC<InfoModalsProps> = ({
  activeModal,
  booths,
  faqs,
  claimedStamps,
  stampFeedback,
  nfcMessage,
  activeSession,
  userProfile,
  onClaimStampDemo,
  onClose,
  savedSessionIds = [],
  onToggleSaveSession,
  onSimulateAlert,
}) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-6 border border-slate-800 max-w-sm w-full space-y-4 max-h-[85vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-base text-white capitalize">
            {activeModal === 'rewards' && 'DevFest Reward Stamps'}
            {activeModal === 'venue_map' && 'Venue Map & Directions'}
            {activeModal === 'faq' && 'Frequently Asked Questions'}
            {activeModal === 'about_gdg' && 'About DevFest & GDG'}
            {activeModal === 'friends' && 'NFC Bump & Friends'}
            {activeModal === 'session' && 'Session Details'}
            {activeModal === 'profile' && 'Attendee Profile'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* VENUE MAP DIALOG */}
        {activeModal === 'venue_map' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 rounded-2xl p-4 space-y-3 border border-slate-800 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#ADC8FF] mx-auto flex items-center justify-center shadow-md">
                <img src={mapSvg} alt="Venue Map" className="w-10 h-10 object-contain" />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-emerald-400">KL Convention Centre (KLCC)</p>
                <p className="text-slate-300 text-[11px]">Level 3 Grand Ballroom & Exhibition Halls</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-left">
                <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700">
                  <span className="text-blue-400 font-bold block">Hall A</span>
                  <span className="text-slate-300 text-[10px]">Tech Stage & Partner Booths</span>
                </div>
                <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700">
                  <span className="text-yellow-400 font-bold block">Hall B</span>
                  <span className="text-slate-300 text-[10px]">Web Stage & Sponsor Booths</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
              <p className="font-bold text-white text-xs">How to Get Here:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li><strong>LRT:</strong> Kelana Jaya Line → KLCC Station (5-min covered walkway).</li>
                <li><strong>MRT:</strong> Putrajaya Line → Persiaran KLCC Station (Exit 2).</li>
                <li><strong>Parking:</strong> Available at KLCC Basement Car Park & Suria KLCC.</li>
              </ul>
            </div>

            <div className="pt-2 text-center border-t border-slate-800">
              <GdgKlLogo inverted />
            </div>
          </div>
        )}

        {/* FAQ DIALOG */}
        {activeModal === 'faq' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2.5 p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-[#ADC8FF] flex items-center justify-center shrink-0">
                <img src={faqSvg} alt="FAQ" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <p className="font-bold text-white">Event Helper & FAQ</p>
                <p className="text-[10px] text-slate-400">Everything you need for DevFest KL 2026</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {faqs.map((f: FAQItem, i: number) => (
                <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <p className="font-bold text-white text-xs">{f.question}</p>
                  <p className="text-slate-400 leading-relaxed text-[11px] font-sans">{f.answer}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center border-t border-slate-800">
              <GdgKlLogo inverted />
            </div>
          </div>
        )}

        {/* ABOUT DEVFEST & GDG DIALOG */}
        {activeModal === 'about_gdg' && (
          <div className="space-y-4 text-xs text-center">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-16 h-12 rounded-2xl bg-[#ADC8FF] mx-auto flex items-center justify-center shadow-md">
                <img src={gdgBwSvg} alt="GDG" className="w-12 h-8 object-contain" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">Google DevFest KL 2026</h4>
                <p className="text-slate-400 text-[11px] italic font-serif">By Google Developer Group Kuala Lumpur</p>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed text-left font-sans">
                <strong>DevFest</strong> is an annual decentralized tech conference hosted by Google Developer Groups (GDG) around the globe. Join developers, designers, and tech leaders in Kuala Lumpur for technical sessions, keynotes, and networking!
              </p>
            </div>

            <div className="pt-2 text-center border-t border-slate-800">
              <GdgKlLogo inverted />
            </div>
          </div>
        )}

        {/* REWARDS STAMPS DIALOG */}
        {activeModal === 'rewards' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-300">
                  Collected <strong className="text-emerald-400">{claimedStamps.length}</strong> of {booths.length} booth stamps
                </p>
                <p className="text-[10px] text-slate-400">Visit GDGKL partner booths & scan QR codes</p>
              </div>
              <img src={gdgklLogo} alt="GDGKL Logo" className="h-6 w-auto object-contain shrink-0" />
            </div>
            <div className="space-y-2">
              {booths.map((b: Booth) => {
                const isClaimed = claimedStamps.includes(b.id);
                return (
                  <div key={b.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={gdgklLogo} alt="" className="h-5 w-auto object-contain opacity-80" />
                      <div>
                        <span className="font-bold text-white block">{b.name}</span>
                        <span className="text-[10px] text-slate-400">{b.location}</span>
                      </div>
                    </div>
                    {isClaimed ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        ✓ Stamped
                      </span>
                    ) : (
                      <button
                        onClick={() => onClaimStampDemo(b.id)}
                        className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 font-bold rounded-lg text-[11px] cursor-pointer hover:bg-yellow-500/30"
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
            <div className="pt-2 text-center border-t border-slate-800/80">
              <GdgKlLogo inverted />
            </div>
          </div>
        )}

        {/* FRIENDS DIALOG */}
        {activeModal === 'friends' && (
          <div className="space-y-4 text-center text-xs">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-2">
              <p className="font-bold text-purple-300">Web NFC Bump Status</p>
              <p className="text-slate-300">{nfcMessage}</p>
            </div>
            <p className="text-slate-400">
              Hold two Android devices back-to-back, or scan another attendee's profile QR code to add as a friend!
            </p>
          </div>
        )}

        {/* SESSION DETAILS DIALOG */}
        {activeModal === 'session' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <img src={activeSession.speaker.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
              <div>
                <p className="font-bold text-white text-sm">{activeSession.speaker.name}</p>
                <p className="text-slate-400 text-[11px]">{activeSession.speaker.role}</p>
              </div>
            </div>
            <p className="font-bold text-blue-400 text-xs">{activeSession.time} • {activeSession.room}</p>
            <p className="text-slate-300 leading-relaxed font-sans">{activeSession.description}</p>
            
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => onToggleSaveSession?.(activeSession.id)}
                  className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    savedSessionIds.includes(activeSession.id)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill={savedSessionIds.includes(activeSession.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>{savedSessionIds.includes(activeSession.id) ? 'Saved' : 'Save to Schedule'}</span>
                </button>

                {savedSessionIds.includes(activeSession.id) && (
                  <button
                    onClick={() => onSimulateAlert?.(activeSession)}
                    className="px-3 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    title="Simulate starting soon warning"
                  >
                    <span>Simulate Demo</span>
                  </button>
                )}
              </div>

              {savedSessionIds.includes(activeSession.id) && (
                <p className="text-[10px] text-slate-400 text-center">
                  💡 Reminders are active. A notification will fire 5 minutes before the session starts.
                </p>
              )}
            </div>
          </div>
        )}

        {/* USER PROFILE DIALOG */}
        {activeModal === 'profile' && (
          <div className="space-y-3 text-xs text-center">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-emerald-500">
              <img src={getAvatarUrl(userProfile.avatar, userProfile.email || userProfile.name)} alt="" className="w-full h-full object-cover" />
            </div>
            <h4 className="font-bold text-white text-sm">{userProfile.name}</h4>
            <p className="text-slate-400">{userProfile.role} • {userProfile.email}</p>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-400 font-semibold">
              ✓ Peatix Ticket Linked
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoModals;
