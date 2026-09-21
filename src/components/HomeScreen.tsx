import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkNFCSupport } from '../lib/nfc';
import bgIcons from '../assets/bg-icons.svg';
import ErrorBoundary from './common/ErrorBoundary';

// Subcomponents & Hooks
import { useConferenceData } from '../hooks/useConferenceData';
import { useSessionAlerts } from '../hooks/useSessionAlerts';
import { HomeHeader } from './home/HomeHeader';
import { OngoingSessionsRail } from './home/OngoingSessionsRail';
import { QuickActionsGrid } from './home/QuickActionsGrid';
import { HomeDrawerContent } from './home/HomeDrawerContent';
import { StartingSoonAlertToast } from './home/StartingSoonAlertToast';

// Sub-Modules & Modals
import PassBadgeModule from './modules/PassBadgeModule';
import ScannerCameraModule from './modules/ScannerCameraModule';
import FriendDiscoveryModule from './modules/FriendDiscoveryModule';
import BoothDiscoveryModule from './modules/BoothDiscoveryModule';
import RewardsModule from './modules/RewardsModule';
import FaqModule from './modules/FaqModule';
import ProfileSettingsModule from './modules/ProfileSettingsModule';
import FriendsModule, { type FriendConnection } from './modules/FriendsModule';
import type { RewardSelection } from './modules/RewardsModule';
import RewardRedeemModal from './modals/RewardRedeemModal';
import InfoModals from './modals/InfoModals';
import FullScheduleModal from './modals/FullScheduleModal';
import type { Session } from '../lib/types';

interface HomeScreenProps {
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  initialUser?: {
    name: string;
    email: string;
    role: string;
    avatar: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    ticketType?: string;
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout, onOpenAdmin, initialUser }) => {
  // Drawer View State
  const [sheetState, setSheetState] = useState<
    'home' | 'scan_qr_1' | 'scan_qr_2' | 'participant_profile' | 'booth_profile' | 'rewards' | 'faq' | 'profile_settings' | 'friends'
  >('home');
  const [selectedFriendDetails, setSelectedFriendDetails] = useState<FriendConnection | null>(null);
  const [activeModal, setActiveModal] = useState<
    'rewards' | 'faq' | 'venue_map' | 'about_gdg' | 'friends' | 'session' | 'profile' | 'notifications' | 'full_schedule' | null
  >(null);

  // UI Interactive States
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardSelection | null>(null);
  const [isTracklistExpanded, setIsTracklistExpanded] = useState(false);
  const [upcomingCycleIndex, setUpcomingCycleIndex] = useState(0);

  // Custom Data Hook
  const {
    booths,
    sessions,
    faqs,
    notifications,
    userProfile,
    discoveredFriend,
    friendsList,
    isFriendsLoading,
    connectionFeedback,
    setConnectionFeedback,
    claimedStamps,
    stampFeedback,
    loginProvider,
    savedSessionIds,
    unreadNotifCount,
    handleToggleSaveSession,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleUpdateProfile,
    handleConnectFriend,
    handleClaimStamp,
    handleRedeemReward,
  } = useConferenceData({
    initialUser,
    onOpenFriendsWithDetails: (friend) => {
      setSelectedFriendDetails(friend);
      setSheetState('friends');
    },
  });

  // Custom Notifications & Alerts Hook
  const { activeAlert, setActiveAlert, handleSimulateAlert } = useSessionAlerts(
    sessions,
    savedSessionIds
  );

  const nfcStatus = checkNFCSupport();

  // Automatically collapse tracklist if drawer is expanded to fullscreen modules
  useEffect(() => {
    if (sheetState !== 'home') {
      setIsTracklistExpanded(false);
    }
  }, [sheetState]);

  // Upcoming sessions cycling logic
  const parseSessionTimeToDate = (timeStr: string): Date => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    return today;
  };

  const getEligibleUpcomingSessions = (): Session[] => {
    if (sessions.length === 0) return [];
    const now = new Date();
    const futureSessions = sessions.filter((s) => {
      const sTime = parseSessionTimeToDate(s.time);
      return sTime.getTime() - now.getTime() > -10 * 60 * 1000;
    });

    if (futureSessions.length === 0) return sessions.slice(-3);

    const sorted = [...futureSessions].sort(
      (a, b) => parseSessionTimeToDate(a.time).getTime() - parseSessionTimeToDate(b.time).getTime()
    );
    const closestTime = parseSessionTimeToDate(sorted[0].time).getTime();

    return sorted.filter((s) => {
      const sTime = parseSessionTimeToDate(s.time).getTime();
      const diffMins = (sTime - closestTime) / (1000 * 60);
      return diffMins >= 0 && diffMins <= 15;
    });
  };

  const eligibleUpcomingSessions = getEligibleUpcomingSessions();
  const activeSession = sessions[selectedSessionIndex] || sessions[0];
  const activeUpcomingSession = eligibleUpcomingSessions[upcomingCycleIndex] || activeSession;

  useEffect(() => {
    if (eligibleUpcomingSessions.length <= 1) {
      setUpcomingCycleIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setUpcomingCycleIndex((prev) => (prev + 1) % eligibleUpcomingSessions.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [eligibleUpcomingSessions.length]);

  const discoveredBooth = booths[0] || {
    id: 'b1',
    name: '42KL',
    category: 'Community',
    logoText: '42 KL',
    location: 'Hall A - #01',
    description: '',
    boothCode: '42KL',
    points: 15,
  };

  const handleScanResult = async (decodedText: string) => {
    setScanResult(decodedText);
    if (decodedText.toLowerCase().includes('booth')) {
      handleClaimStamp('b1');
      setSheetState('booth_profile');
    } else {
      await handleConnectFriend(decodedText, 'QR Scan');
    }
  };

  const handleNfcBump = async (token?: string) => {
    const payload = token || 'NFC-AMANDA-CLOUD';
    await handleConnectFriend(payload, 'NFC Bump');
  };

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    setIsTracklistExpanded(false);
    if (info.offset.y > 80 || info.velocity.y > 200) {
      if (sheetState === 'scan_qr_2') {
        setSheetState('scan_qr_1');
      } else {
        setSheetState('home');
      }
    }
  };

  const isExpanded = sheetState !== 'home';
  const drawerHeight = isExpanded
    ? 'calc(100% - 64px)'
    : isTracklistExpanded
    ? 'calc(100% - 475px)'
    : 'calc(100% - 365px)';

  return (
    <div className="h-screen bg-[#3B9E59] text-slate-900 flex flex-col items-center justify-start overflow-hidden font-sans select-none">
      <div className="w-full max-w-md h-full flex flex-col relative shadow-2xl overflow-hidden bg-[#3B9E59]">
        {/* Background Decorative Icons */}
        <div className="absolute top-0 left-0 right-0 h-[50%] overflow-hidden pointer-events-none z-0 select-none">
          <img src={bgIcons} alt="" className="w-full h-full object-cover object-top" />
        </div>

        {/* Top Header & Visuals */}
        <div className="p-5 pt-6 pb-2 space-y-4 relative shrink-0">
          <HomeHeader
            userProfile={userProfile}
            unreadNotifCount={unreadNotifCount}
            connectionFeedback={connectionFeedback}
            onDismissFeedback={() => setConnectionFeedback(null)}
            onOpenNotifications={() => setActiveModal('notifications')}
            onOpenProfile={() => setActiveModal('profile')}
          />

          <OngoingSessionsRail
            sessions={sessions}
            savedSessionIds={savedSessionIds}
            selectedSessionIndex={selectedSessionIndex}
            isTracklistExpanded={isTracklistExpanded}
            onToggleExpand={() => setIsTracklistExpanded(!isTracklistExpanded)}
            onOpenFullSchedule={() => setActiveModal('full_schedule')}
            onSelectSession={(idx) => {
              setSelectedSessionIndex(idx);
              setActiveModal('session');
            }}
          />

          <QuickActionsGrid
            onOpenQr={() => setSheetState('scan_qr_1')}
            onOpenRewards={() => setSheetState('rewards')}
            onOpenFaq={() => setSheetState('faq')}
            onOpenFriends={() => setSheetState('friends')}
          />
        </div>

        {/* Bottom Sheet Drawer */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
          initial={false}
          animate={{ height: drawerHeight }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="absolute left-0 right-0 bottom-0 bg-[#1C1D21] text-slate-100 rounded-t-[32px] p-5 pt-3 pb-6 border-t border-slate-800 shadow-2xl flex flex-col justify-between z-30 touch-pan-y"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto shrink-0 mb-2 cursor-grab active:cursor-grabbing" />

          <AnimatePresence mode="wait">
            {/* STATE 1: HOME SHEET */}
            {sheetState === 'home' && (
              <HomeDrawerContent
                activeUpcomingSession={activeUpcomingSession}
                onSelectUpcomingSession={(sess) => {
                  const idx = sessions.findIndex((s) => s.id === sess.id);
                  setSelectedSessionIndex(idx !== -1 ? idx : 0);
                  setActiveModal('session');
                }}
                onOpenFriends={() => setSheetState('friends')}
                onOpenRewards={() => setSheetState('rewards')}
                onOpenFaq={() => setSheetState('faq')}
              />
            )}

            {/* STATE 2: PASS BADGE */}
            {sheetState === 'scan_qr_1' && (
              <PassBadgeModule
                userName={userProfile.name}
                userRole={userProfile.role}
                qrPayload={userProfile.qrPayload}
                onOpenScanner={() => setSheetState('scan_qr_2')}
              />
            )}

            {/* STATE 3: CAMERA SCANNER */}
            {sheetState === 'scan_qr_2' && (
              <ErrorBoundary
                onReset={() => setSheetState('scan_qr_1')}
                fallback={
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-900 text-white rounded-3xl m-4 border border-slate-800">
                    <p className="text-sm font-bold text-amber-400">Camera encountered an issue.</p>
                    <button
                      onClick={() => setSheetState('scan_qr_1')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer"
                    >
                      Return to Badge
                    </button>
                  </div>
                }
              >
                <ScannerCameraModule
                  scanResult={scanResult}
                  onScanResult={handleScanResult}
                  onClearScan={() => setScanResult(null)}
                  onBackToBadge={() => setSheetState('scan_qr_1')}
                  onNfcBump={handleNfcBump}
                  onTriggerFriendDemo={() => handleNfcBump()}
                  onTriggerBoothDemo={() => setSheetState('booth_profile')}
                  userName={userProfile.name}
                  userRole={userProfile.role}
                  qrPayload={userProfile.qrPayload}
                  isNfcSupported={nfcStatus.isSupported}
                />
              </ErrorBoundary>
            )}

            {/* STATE 4: FRIEND DISCOVERY */}
            {sheetState === 'participant_profile' && (
              <FriendDiscoveryModule
                friend={discoveredFriend}
                onBackToHome={() => setSheetState('home')}
              />
            )}

            {/* STATE 5: BOOTH DISCOVERY */}
            {sheetState === 'booth_profile' && (
              <BoothDiscoveryModule
                booth={discoveredBooth}
                claimedStamps={claimedStamps}
                onBackToHome={() => setSheetState('home')}
              />
            )}

            {/* STATE 6: REWARDS MODULE */}
            {sheetState === 'rewards' && (
              <RewardsModule
                claimedStamps={claimedStamps}
                onSelectReward={(r) => setSelectedReward(r)}
                onBackToHome={() => setSheetState('home')}
              />
            )}

            {/* STATE 7: FAQ & INFO MODULE */}
            {sheetState === 'faq' && (
              <FaqModule
                onOpenDialog={(dialogType) => setActiveModal(dialogType)}
                onBackToHome={() => setSheetState('home')}
              />
            )}

            {/* STATE 8: PROFILE SETTINGS MODULE */}
            {sheetState === 'profile_settings' && (
              <ProfileSettingsModule
                userProfile={userProfile}
                provider={loginProvider}
                onSaveProfile={handleUpdateProfile}
                onBackToHome={() => setSheetState('home')}
              />
            )}

            {/* STATE 9: FRIENDS MODULE */}
            {sheetState === 'friends' && (
              <FriendsModule
                friends={friendsList}
                isLoading={isFriendsLoading}
                initialSelectedFriend={selectedFriendDetails}
                onBackToHome={() => setSheetState('home')}
                onOpenQrOrNfc={() => setSheetState('scan_qr_1')}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* REWARD REDEEM MODAL */}
        {selectedReward && (
          <RewardRedeemModal
            reward={selectedReward}
            isRedeemed={false}
            onClose={() => setSelectedReward(null)}
            onRedeem={handleRedeemReward}
          />
        )}

        {/* INFO DIALOG MODALS */}
        <InfoModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          booths={booths}
          faqs={faqs}
          claimedStamps={claimedStamps}
          stampFeedback={stampFeedback}
          nfcMessage={nfcStatus.message}
          activeSession={activeSession}
          onClaimStampDemo={handleClaimStamp}
          onSimulateAlert={handleSimulateAlert}
          savedSessionIds={savedSessionIds}
          onToggleSaveSession={handleToggleSaveSession}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          userProfile={userProfile}
          onLogout={onLogout}
          onOpenProfileSettings={() => {
            setActiveModal(null);
            setSheetState('profile_settings');
          }}
          onOpenAdmin={onOpenAdmin}
        />

        {/* FULL EVENT SCHEDULE MODAL */}
        <FullScheduleModal
          isOpen={activeModal === 'full_schedule'}
          onClose={() => setActiveModal(null)}
          sessions={sessions}
          savedSessionIds={savedSessionIds}
          onToggleSaveSession={handleToggleSaveSession}
          onSelectSessionDetail={(sess) => {
            const idx = sessions.findIndex((s) => s.id === sess.id);
            setSelectedSessionIndex(idx !== -1 ? idx : 0);
            setActiveModal('session');
          }}
        />

        {/* IN-APP STARTING SOON TOAST NOTIFICATION */}
        <AnimatePresence>
          <StartingSoonAlertToast
            alert={activeAlert}
            onDismiss={() => setActiveAlert(null)}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomeScreen;
