import React from 'react';
import gdgklLogo from '../../assets/GDGKL-logo.png';
import floorplanSvg from '../../assets/devfest-26-floorplan-draw.svg';
import faqSvg from '../../assets/faq.svg';
import gdgBwSvg from '../../assets/gdg-bw.svg';
import odraVentureLogo from '../../assets/sponsors/odra-venture-logo.png';
import jobstreetLogo from '../../assets/sponsors/JOBSTREET_small scale.png';
import derivLogo from '../../assets/sponsors/DERIV_LOGO.png';
import ellmLogo from '../../assets/sponsors/ellm-white.svg';
import logitechLogo from '../../assets/sponsors/Logitech.png';
import sunwayLogo from '../../assets/sponsors/sunway-education-logo-horizontal.png';
import campusConscienceLogo from '../../assets/sponsors/campus-with-a-conscience.png';
import malaysia42Logo from '../../assets/sponsors/42 MALAYSIA.png';
import cradleLogo from '../../assets/sponsors/cradle.png';
import { CloseIcon } from '../common/Icons';
import { getAvatarUrl } from '../../lib/avatar';
import GdgKlLogo from '../common/GdgKlLogo';
import {
  getNotificationStatus,
  requestNotificationPermission,
  sendSystemNotificationDetailed,
  registerDevicePushSubscription,
} from '../../lib/notifications';
import { notificationsService } from '../../services/notificationsService';
import type { Booth, FAQItem, Session, AppNotification } from '../../lib/types';

interface InfoModalsProps {
  activeModal: 'rewards' | 'faq' | 'venue_map' | 'about_gdg' | 'friends' | 'session' | 'profile' | 'notifications' | 'full_schedule' | null;
  booths: Booth[];
  faqs: FAQItem[];
  claimedStamps: string[];
  stampFeedback: string | null;
  activeSession: Session;
  userProfile: {
    name: string;
    role: string;
    email: string;
    avatar: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    ticketType?: string;
  };
  onClaimStampDemo?: (boothId: string) => void;
  onClose: () => void;
  savedSessionIds?: string[];
  onToggleSaveSession?: (sessionId: string) => void;
  onSimulateAlert?: (session: Session) => void;
  onLogout?: () => void;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onOpenProfileSettings?: () => void;
  onOpenAdmin?: () => void;
}

export const InfoModals: React.FC<InfoModalsProps> = ({
  activeModal,
  booths,
  faqs,
  claimedStamps,
  stampFeedback,
  activeSession,
  userProfile,
  onClaimStampDemo: _onClaimStampDemo,
  onClose,
  savedSessionIds = [],
  onToggleSaveSession,
  onSimulateAlert,
  onLogout,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenProfileSettings,
  onOpenAdmin,
}) => {
  const [notifStatus, setNotifStatus] = React.useState(() => getNotificationStatus());
  const [testNotificationFeedback, setTestNotificationFeedback] = React.useState<string | null>(null);
  const [isFloorplanZoomed, setIsFloorplanZoomed] = React.useState(false);

  React.useEffect(() => {
    if (activeModal === 'notifications') {
      setNotifStatus(getNotificationStatus());
    }
  }, [activeModal]);

  const handleEnableSystemNotifications = async () => {
    const perm = await requestNotificationPermission();
    const updated = getNotificationStatus();
    setNotifStatus(updated);
    if (perm === 'granted') {
      if (userProfile.email) {
        registerDevicePushSubscription(userProfile.email).catch((e) => {
          console.warn('[Push] Background registration warning:', e);
        });
      }

      await sendSystemNotificationDetailed('DevFest KL 2026', {
        body: '🎉 System notifications enabled! You will receive timely alerts for bookmarked sessions even when the app is closed.',
        icon: '/pwa-192x192.png',
      });
      setTestNotificationFeedback('🎉 Notifications enabled! Lockscreen alerts are now active even when the app is closed.');
      setTimeout(() => setTestNotificationFeedback(null), 6000);
    }
  };

  const handleSendTestNotification = async () => {
    setTestNotificationFeedback('Sending notification...');

    sendSystemNotificationDetailed('DevFest KL 2026', {
      body: '🔔 Test Notification: System alerts and session reminders are active on your device!',
      icon: '/pwa-192x192.png',
    }).catch(() => {});

    if (userProfile.email) {
      try {
        const pushRes = await notificationsService.sendTestPush(userProfile.email);
        if (pushRes.success) {
          setTestNotificationFeedback(`🚀 Web Push verified! Delivered to ${pushRes.devicesFound || 1} device(s). Alerts will work even when the app is closed!`);
        } else {
          setTestNotificationFeedback('🔔 Test notification sent locally. (Tap "Enable Device Notifications" to activate lockscreen alerts when closed).');
        }
      } catch {
        setTestNotificationFeedback('🔔 Test notification sent locally to your device!');
      }
    } else {
      setTestNotificationFeedback('🔔 Test notification sent to your device!');
    }

    setTimeout(() => setTestNotificationFeedback(null), 7000);
  };

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`glass-card rounded-3xl p-6 border border-slate-800 w-full space-y-4 max-h-[85vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 ${activeModal === 'about_gdg' ? 'max-w-md' : activeModal === 'venue_map' ? 'max-w-xl' : 'max-w-sm'}`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-base text-white capitalize">
            {activeModal === 'rewards' && 'DevFest Reward Stamps'}
            {activeModal === 'venue_map' && 'Venue Map & Directions'}
            {activeModal === 'faq' && 'Frequently Asked Questions'}
            {activeModal === 'about_gdg' && 'DevFest Sponsors & Partners'}
            {activeModal === 'friends' && 'Networking & Friends'}
            {activeModal === 'session' && 'Session Details'}
            {activeModal === 'profile' && 'Attendee Profile'}
            {activeModal === 'notifications' && 'Conference Notifications'}
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
          <div className="space-y-3.5 text-xs">
            {/* Floorplan Header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="space-y-0.5">
                <p className="font-heading font-extrabold text-sm text-white">Event Floorplan</p>
                <p className="text-[11px] text-slate-400">Sunway University • Jeffrey Cheah Hall (JC1, JC2, JC3)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFloorplanZoomed(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                title="Tap to zoom floorplan"
              >
                <span>🔍</span>
                <span>Zoom View</span>
              </button>
            </div>

            {/* Interactive Floorplan Drawing Card */}
            <div
              onClick={() => setIsFloorplanZoomed(true)}
              className="relative group bg-white rounded-2xl p-2 border-2 border-slate-700 overflow-hidden shadow-xl cursor-zoom-in transition-all hover:border-emerald-500/80"
            >
              <img
                src={floorplanSvg}
                alt="DevFest 2026 Floorplan"
                className="w-full h-auto object-contain rounded-xl max-h-[300px] select-none"
              />
              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-xl">
                <span className="px-3 py-1.5 rounded-full bg-slate-900/90 text-white font-bold text-xs shadow-lg border border-white/20 flex items-center gap-1.5">
                  <span>🔍</span> Tap to Expand Fullscreen
                </span>
              </div>
            </div>

            {/* Room / Track Quick Reference */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl">
                <span className="block font-heading font-black text-xs text-red-400">JC1</span>
                <span className="block text-[10px] font-medium text-slate-300">Builder Track</span>
              </div>
              <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl">
                <span className="block font-heading font-black text-xs text-blue-400">JC2</span>
                <span className="block text-[10px] font-medium text-slate-300">Developer Track</span>
              </div>
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                <span className="block font-heading font-black text-xs text-amber-400">JC3</span>
                <span className="block text-[10px] font-medium text-slate-300">Hands-On Track</span>
              </div>
            </div>

            {/* Partner Booths Quick Legend */}
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
              <p className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-400">
                Key Facilities & Booths
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">A</span>
                  <span className="truncate">Logitech</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">B</span>
                  <span className="truncate">Jobstreet by SEEK</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">C</span>
                  <span className="truncate">Odra Venture</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">D</span>
                  <span className="truncate">Cradle Fund</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">E</span>
                  <span className="truncate">Ice Cream Station</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">F</span>
                  <span className="truncate">Popcorn & Cotton Candy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">G</span>
                  <span className="truncate">Game Booth</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">H</span>
                  <span className="truncate">Deriv</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">I</span>
                  <span className="truncate">42 Malaysia</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold font-mono text-[9px] border border-slate-700">J</span>
                  <span className="truncate">GDG KL Booth</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-emerald-900/60 text-emerald-300 flex items-center justify-center font-bold text-[9px] border border-emerald-500/40">★</span>
                  <span className="truncate">Vibing Lounge</span>
                </div>
              </div>
            </div>

            {/* Fullscreen Zoom Lightbox Modal */}
            {isFloorplanZoomed && (
              <div
                className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-in fade-in duration-200"
                onClick={() => setIsFloorplanZoomed(false)}
              >
                <div className="flex items-center justify-between pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-black text-sm text-white">DevFest 2026 Floorplan</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Fullscreen
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFloorplanZoomed(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    aria-label="Close fullscreen map"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div
                  className="grow flex items-center justify-center overflow-auto rounded-2xl bg-white p-2 border-2 border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={floorplanSvg}
                    alt="DevFest 2026 Floorplan Detailed"
                    className="max-w-full max-h-[82vh] w-auto h-auto object-contain select-none"
                  />
                </div>
                <p className="text-center text-[11px] text-slate-400 pt-2 shrink-0">
                  Pinch or scroll to inspect • Tap outside or close button to return
                </p>
              </div>
            )}

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
                  {f.category && (
                    <span className="inline-block text-[9px] font-mono uppercase tracking-wider text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      {f.category}
                    </span>
                  )}
                  <p className="font-bold text-white text-xs">{f.question}</p>
                  <p className="text-slate-400 leading-relaxed text-[11px] font-sans whitespace-pre-line">{f.answer}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center border-t border-slate-800">
              <GdgKlLogo inverted />
            </div>
          </div>
        )}

        {/* ABOUT DEVFEST & SPONSORS DIALOG */}
        {activeModal === 'about_gdg' && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-center">
              <div className="w-14 h-10 rounded-xl bg-[#ADC8FF] mx-auto flex items-center justify-center shadow-md">
                <img src={gdgBwSvg} alt="GDG" className="w-10 h-7 object-contain" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">Google DevFest KL 2026</h4>
                <p className="text-slate-400 text-[11px] italic font-serif">By Google Developer Group Kuala Lumpur</p>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed text-center font-sans">
                DevFest is an annual decentralized tech conference hosted by Google Developer Groups (GDG). A massive thank you to our esteemed sponsors and partners for making DevFest Kuala Lumpur 2026 possible!
              </p>
            </div>

            {/* UNIFORM EQUAL-SIZED SPONSOR TIERS */}
            {[
              {
                title: 'Gold Sponsors',
                dotClass: 'bg-amber-400 shadow-amber-400/50',
                titleClass: 'text-amber-300',
                items: [
                  { name: 'Odra Venture', logo: odraVentureLogo },
                  { name: 'Jobstreet by SEEK', logo: jobstreetLogo },
                  { name: 'deriv', logo: derivLogo },
                ],
              },
              {
                title: 'Silver Sponsors',
                dotClass: 'bg-slate-300 shadow-slate-300/50',
                titleClass: 'text-slate-300',
                items: [
                  { name: 'Embedded LLM', logo: ellmLogo },
                  { name: 'Logitech', logo: logitechLogo },
                ],
              },
              {
                title: 'Venue Sponsors',
                dotClass: 'bg-emerald-400 shadow-emerald-400/50',
                titleClass: 'text-emerald-300',
                items: [
                  { name: 'Sunway Education', logo: sunwayLogo },
                  { name: 'Campus with a Conscience', logo: campusConscienceLogo },
                  { name: '42 Malaysia', logo: malaysia42Logo },
                ],
              },
              {
                title: 'Ecosystem Partner',
                dotClass: 'bg-sky-400 shadow-sky-400/50',
                titleClass: 'text-sky-300',
                items: [
                  { name: 'Cradle', logo: cradleLogo },
                ],
              },
            ].map((tier) => (
              <div key={tier.title} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${tier.dotClass}`} />
                  <h5 className={`font-heading font-extrabold text-[11px] uppercase tracking-wider ${tier.titleClass}`}>
                    {tier.title}
                  </h5>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {tier.items.map((sponsor) => (
                    <div
                      key={sponsor.name}
                      className="bg-white rounded-2xl p-3 flex items-center justify-center h-16 shadow-md border border-slate-200/20 hover:scale-[1.01] transition-transform"
                    >
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        title={sponsor.name}
                        className="max-h-9 w-auto max-w-[70%] object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

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
                      <span className="text-slate-500 font-medium text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">Scan at booth</span>
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
              <p className="font-bold text-purple-300">Attendee Networking</p>
              <p className="text-slate-300">
                Scan another attendee's badge QR code using the in-app scanner to connect instantly!
              </p>
            </div>
            <p className="text-slate-400">
              Connected attendees will appear in your Friends list with their role and social links.
            </p>
          </div>
        )}

        {/* SESSION DETAILS DIALOG */}
        {activeModal === 'session' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <img src={activeSession.speaker.avatar || getAvatarUrl(activeSession.speaker.name)} className="w-10 h-10 rounded-xl object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(activeSession.speaker.name); }} />
              <div>
                <p className="font-bold text-white text-sm">{activeSession.speaker.name}</p>
                <p className="text-slate-400 text-[11px]">{activeSession.speaker.role}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-bold text-blue-400 text-xs">{activeSession.time} • {activeSession.room}</p>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                <span>🔥</span>
                <span>{activeSession.rsvpCount ?? 0} RSVP'd</span>
              </span>
            </div>
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
                  <span>{savedSessionIds.includes(activeSession.id) ? 'Saved (RSVP Confirmed)' : 'RSVP / Save to Schedule'}</span>
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

        {/* NOTIFICATIONS DIALOG */}
        {activeModal === 'notifications' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <p className="text-[11px] text-slate-400 font-mono">
                {notifications.filter((n) => !n.isRead).length} unread updates
              </p>
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={() => onMarkAllNotificationsRead?.()}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Device Notifications Status & Test Card */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔔</span>
                  <span className="font-bold text-white text-[11px]">Device Notifications</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      notifStatus.isStandalonePWA
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {notifStatus.isStandalonePWA ? 'Standalone PWA' : 'Browser Tab'}
                  </span>
                </div>
                {notifStatus.permission === 'granted' ? (
                  <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ✓ Active
                  </span>
                ) : notifStatus.permission === 'denied' ? (
                  <span className="text-red-400 font-bold text-[10px] bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                    Blocked
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Not Enabled
                  </span>
                )}
              </div>

              <p className="text-[10.5px] text-slate-400 leading-snug">
                {notifStatus.platformMessage}
              </p>

              {testNotificationFeedback && (
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold text-center animate-pulse">
                  {testNotificationFeedback}
                </div>
              )}

              <div className="flex items-center gap-2 pt-0.5">
                {notifStatus.permission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleEnableSystemNotifications}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all active:scale-98 cursor-pointer shadow-md"
                  >
                    Enable Device Notifications
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10.5px] transition-all active:scale-98 cursor-pointer"
                  >
                    🔔 Send Test Notification
                  </button>
                )}
              </div>

              {notifStatus.permission === 'granted' && (
                <p className="text-[9.5px] text-slate-400 border-t border-slate-800/80 pt-2 leading-tight">
                  💡 <strong>Still not seeing a banner?</strong> Ensure phone OS Settings &gt; Apps &gt; Chrome (or DevFest) &gt; Notifications is turned ON, and Do Not Disturb / Focus mode is off.
                </p>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">🔔</span>
                <p className="text-xs font-semibold text-slate-300">No notifications yet</p>
                <p className="text-[10px] text-slate-500">You're all caught up with DevFest announcements!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {notifications.map((notif) => {
                  const isUnread = !notif.isRead;
                  const isSession = notif.type === 'session_alert';
                  const isLucky = notif.type === 'lucky_draw';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => isUnread && onMarkNotificationRead?.(notif.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                        isUnread
                          ? 'bg-slate-900 border-blue-500/40 shadow-sm hover:border-blue-400'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isSession
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isLucky
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {isSession ? 'Session Alert' : isLucky ? 'Lucky Draw' : 'Announcement'}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" title="Unread" />
                        )}
                      </div>
                      <h4 className={`text-xs font-bold leading-snug ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-sans">
                        {notif.message}
                      </p>
                      {notif.targetTrack && notif.targetTrack !== 'All' && (
                        <span className="inline-block mt-1.5 text-[9px] text-slate-400 font-mono">
                          Track: {notif.targetTrack}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* USER PROFILE DIALOG */}
        {activeModal === 'profile' && (
          <div className="space-y-3 text-xs text-center">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-emerald-500">
              <img src={getAvatarUrl(userProfile.avatar, userProfile.email || userProfile.name)} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{userProfile.name}</h4>
              <p className="text-slate-400">{userProfile.role} • {userProfile.email}</p>
            </div>

            {userProfile.bio && (
              <p className="text-slate-300 text-[11px] italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed text-left">
                "{userProfile.bio}"
              </p>
            )}

            {(userProfile.githubUrl || userProfile.linkedinUrl) && (
              <div className="flex items-center justify-center gap-2 pt-0.5">
                {userProfile.githubUrl && (
                  <a
                    href={userProfile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>GitHub</span>
                  </a>
                )}
                {userProfile.linkedinUrl && (
                  <a
                    href={userProfile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            )}

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold">✓ Luma Ticket Linked</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  userProfile.ticketType?.toLowerCase() === 'core team'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {userProfile.ticketType || 'Standard Attendee'}
              </span>
            </div>

            {userProfile.ticketType?.toLowerCase() === 'core team' && onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/40"
              >
                <span>⚡</span>
                <span>Enter Admin & Operations Console ↗</span>
              </button>
            )}

            {onOpenProfileSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfileSettings();
                }}
                className="w-full py-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 font-bold transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Profile Settings</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold transition-all cursor-pointer text-xs"
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoModals;
