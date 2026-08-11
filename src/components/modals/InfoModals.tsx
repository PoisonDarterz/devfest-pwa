import React from 'react';
import gdgklLogo from '../../assets/GDGKL-logo.png';
import { CloseIcon } from '../common/Icons';
import GdgKlLogo from '../common/GdgKlLogo';
import type { Booth, FAQItem, Session } from '../../lib/types';

interface InfoModalsProps {
  activeModal: 'rewards' | 'faq' | 'friends' | 'session' | 'profile' | null;
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
}) => {
  if (!activeModal) return null;

  return (
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
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

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
              <GdgKlLogo />
            </div>
          </div>
        )}

        {activeModal === 'faq' && (
          <div className="space-y-3 text-xs">
            {faqs.map((f: FAQItem, i: number) => (
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
              <p className="text-slate-300">{nfcMessage}</p>
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
              <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
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
