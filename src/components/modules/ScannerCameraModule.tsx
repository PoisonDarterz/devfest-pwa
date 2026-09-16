import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import pinkFlower from '../../assets/pink-flower.svg';
import bluePlus from '../../assets/blue-plus.svg';
import redHeart from '../../assets/red-heart.svg';
import { checkNFCSupport } from '../../lib/nfc';

interface ScannerCameraModuleProps {
  scanResult: string | null;
  onScanResult: (decodedText: string) => void;
  onClearScan: () => void;
  onBackToBadge: () => void;
  onNfcBump?: (payload?: string) => void;
  onTriggerFriendDemo: () => void;
  onTriggerBoothDemo: () => void;
  userName?: string;
  userRole?: string;
  qrPayload?: string;
  isNfcSupported?: boolean;
}

export const ScannerCameraModule: React.FC<ScannerCameraModuleProps> = ({
  scanResult,
  onScanResult,
  onClearScan,
  onBackToBadge,
  onNfcBump,
  onTriggerFriendDemo,
  onTriggerBoothDemo,
  userName = 'Zixu Cheah',
  userRole = 'Software Engineer',
  qrPayload = 'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
  isNfcSupported,
}) => {
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'running' | 'error'>('starting');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);

  const [nfcBumpFeedback, setNfcBumpFeedback] = useState<string | null>(null);
  const [isNfcActive, setIsNfcActive] = useState(false);
  const hasNfc = isNfcSupported ?? checkNFCSupport().isSupported;

  // Initialize Web NFC Reader if supported
  useEffect(() => {
    let abortController: AbortController | null = null;

    if ('NDEFReader' in window) {
      try {
        abortController = new AbortController();
        const NDEF = (window as any).NDEFReader;
        const ndef = new NDEF();

        ndef
          .scan({ signal: abortController.signal })
          .then(() => {
            setIsNfcActive(true);
            ndef.onreading = (event: any) => {
              if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
              setNfcBumpFeedback('NFC Bump Detected! Exchanging profiles...');

              const record = event?.message?.records?.[0];
              let text = '';
              if (record && record.recordType === 'text') {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                text = textDecoder.decode(record.data);
              }

              setTimeout(() => {
                setNfcBumpFeedback(null);
                if (onNfcBump) {
                  onNfcBump(text || 'NFC-AMANDA-CLOUD');
                } else if (text) {
                  onScanResult(text);
                } else {
                  onTriggerFriendDemo();
                }
              }, 800);
            };
          })
          .catch((err: any) => {
            console.warn('Web NFC scanning unavailable or permission denied:', err);
          });
      } catch (err) {
        console.warn('NDEFReader initialization error:', err);
      }
    }

    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [onScanResult, onTriggerFriendDemo]);

  // Function to initialize and start the camera stream directly
  const startCameraStream = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraState('starting');
    setCameraErrorMessage(null);

    try {
      if (!qrCodeRef.current) {
        qrCodeRef.current = new Html5Qrcode('qr-camera-viewfinder');
      }

      await qrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: { width: 220, height: 220 },
        },
        async (decodedText) => {
          if (navigator.vibrate) navigator.vibrate(60);
          const scanner = qrCodeRef.current;
          if (scanner && scanner.isScanning) {
            try {
              await scanner.stop();
            } catch {}
          }
          onScanResult(decodedText);
        },
        () => {
          // per-frame attempts, safe to ignore
        }
      );

      setCameraState('running');
    } catch (err: any) {
      console.warn('Html5Qrcode direct camera start error:', err);
      setCameraState('error');

      const isHttps =
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (!isHttps) {
        setCameraErrorMessage('Camera requires a secure connection (HTTPS or localhost) on mobile phones.');
      } else if (
        err?.name === 'NotAllowedError' ||
        err?.message?.includes('Permission') ||
        err?.message?.includes('NotAllowedError')
      ) {
        setCameraErrorMessage('Camera permission was blocked. Tap "Allow Camera" below to grant access.');
      } else if (err?.name === 'NotFoundError' || err?.message?.includes('Requested device not found')) {
        setCameraErrorMessage('No camera was detected on this device.');
      } else {
        setCameraErrorMessage(err?.message || 'Unable to start camera.');
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  // Mount camera on load
  useEffect(() => {
    const timer = setTimeout(() => {
      startCameraStream();
    }, 200);

    return () => {
      clearTimeout(timer);
      const scanner = qrCodeRef.current;
      if (scanner) {
        try {
          if (scanner.isScanning) {
            scanner
              .stop()
              .then(() => {
                try {
                  scanner.clear();
                } catch {}
              })
              .catch(() => {});
          } else {
            try {
              scanner.clear();
            } catch {}
          }
        } catch {}
      }
    };
  }, [onScanResult]);

  // Handle interactive NFC bump trigger / test simulation
  const [bumpIndex, setBumpIndex] = useState(0);
  const DEMO_BUMP_TOKENS = ['NFC-AMANDA-CLOUD', 'NFC-WEIKANG-AI', 'NFC-JUNYI-DEV', 'NFC-SARAH-TAN', 'NFC-AISHA-DEVOPS'];

  const handleNfcBumpTap = () => {
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    setNfcBumpFeedback('NFC Bump Detected! Exchanging profiles...');
    const token = DEMO_BUMP_TOKENS[bumpIndex % DEMO_BUMP_TOKENS.length];
    setBumpIndex((prev) => prev + 1);

    setTimeout(() => {
      setNfcBumpFeedback(null);
      if (onNfcBump) {
        onNfcBump(token);
      } else {
        onTriggerFriendDemo();
      }
    }, 900);
  };

  const handleExitScanner = async () => {
    try {
      if (qrCodeRef.current?.isScanning) {
        await qrCodeRef.current.stop();
      }
    } catch {}
    onBackToBadge();
  };

  return (
    <motion.div
      key="scan-qr-2"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col h-full w-full overflow-hidden text-white select-none bg-gradient-to-b from-[#2A1545] via-[#351C57] to-[#190F28]"
    >
      {/* Top Header Bar: Clean Close Control */}
      <div className="flex items-center justify-end px-3 pt-1 pb-1 z-30 shrink-0">
        <button
          type="button"
          onClick={handleExitScanner}
          className="p-1.5 rounded-full bg-slate-900/60 text-purple-200 hover:text-white transition-colors cursor-pointer border border-purple-400/20"
          title="Close"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ================================================================= */}
      {/* 1. TOP NFC BUMP PROMPT & BLURRED PASS CARD BACKGROUND            */}
      {/* ================================================================= */}
      <div className="grow flex flex-col items-center justify-start pt-1 pb-2 relative z-10 overflow-hidden">
        {/* Contactless / NFC Wave Icon */}
        <button
          type="button"
          onClick={handleNfcBumpTap}
          className="group relative w-13 h-13 rounded-full border-2 border-purple-300/80 bg-purple-950/50 flex items-center justify-center text-purple-200 shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title={hasNfc && isNfcActive ? 'Web NFC Ready - Tap to bump' : 'Tap to test NFC Bump profile exchange'}
        >
          {/* Active NFC status dot */}
          {hasNfc && isNfcActive && (
            <span
              className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-purple-900 animate-pulse"
              title="NFC Ready"
            />
          )}

          {/* Animated pulse halo */}
          <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping opacity-60 pointer-events-none" />

          {/* 4 Concentric Contactless Arcs */}
          <svg
            className="w-6 h-6 transform rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M7 16.5a6 6 0 0 1 0-9" />
            <path d="M10 18.5a9 9 0 0 1 0-13" />
            <path d="M13 20.5a12 12 0 0 1 0-17" />
            <path d="M16 22.5a15 15 0 0 1 0-21" />
          </svg>
        </button>

        {/* Italic NFC Instructions Text */}
        <p
          onClick={handleNfcBumpTap}
          className="font-serif italic text-purple-200/90 text-[13px] leading-snug text-center mt-2.5 max-w-[210px] mx-auto select-none cursor-pointer hover:text-white transition-colors"
        >
          Gently tap phones together to exchange profiles
        </p>

        {/* NFC Status Banner if bumping */}
        {nfcBumpFeedback && (
          <div className="mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold animate-pulse z-30">
            {nfcBumpFeedback}
          </div>
        )}

        {/* SUBTLE BLURRED PASS BADGE IN THE BACKGROUND */}
        <div className="relative w-full max-w-[240px] mt-1 filter blur-[2px] opacity-40 scale-[0.82] pointer-events-none select-none">
          <div className="absolute -top-3 -left-3 z-10 transform -rotate-12">
            <img src={pinkFlower} alt="" className="w-10 h-10" />
          </div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 transform rotate-6">
            <img src={bluePlus} alt="" className="w-11 h-11" />
          </div>
          <div className="absolute -top-3 -right-3 z-10 transform rotate-12">
            <img src={redHeart} alt="" className="w-10 h-10" />
          </div>

          <div className="bg-[#ECE6DA] text-slate-900 rounded-[24px] p-4 shadow-xl border-2 border-[#DED7C9] text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <span className="font-heading font-black text-sm text-slate-950">DevFest</span>
              <span className="bg-[#F7B033] text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                2026
              </span>
            </div>

            <div className="bg-white p-2 rounded-xl inline-block shadow-inner border border-slate-200">
              <QRCodeSVG value={qrPayload} size={110} level="M" />
            </div>

            <div>
              <h4 className="font-heading font-bold text-base text-slate-950">{userName}</h4>
              <p className="text-[10px] font-semibold text-slate-600">{userRole}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. BOTTOM SHEET / CAMERA VIEWFINDER CARD                          */}
      {/* ================================================================= */}
      <div className="w-full bg-[#ECE6DA] rounded-t-[36px] shadow-2xl p-5 pt-4 pb-6 flex flex-col items-center relative z-20 shrink-0 text-slate-900 border-t border-slate-300/30">
        {/* Top Text above Viewfinder */}
        <p className="font-serif italic text-slate-700 text-[13px] text-center mb-3 select-none">
          Hold your camera over the QR code
        </p>

        {/* Viewfinder Dark Window */}
        <div className="w-full max-w-[270px] aspect-square rounded-[26px] bg-[#2E2F34] overflow-hidden border-2 border-slate-700/60 shadow-inner relative flex items-center justify-center text-white">
          <div id="qr-camera-viewfinder" className="w-full h-full object-cover" />

          {/* Camera Starting Spinner */}
          {cameraState === 'starting' && !scanResult && (
            <div className="absolute inset-0 bg-[#2E2F34] flex flex-col items-center justify-center p-4 text-center space-y-2 z-10">
              <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              <p className="text-[11px] text-slate-300 font-medium">Starting camera...</p>
            </div>
          )}

          {/* Camera Error / Permission Blocked Message */}
          {cameraState === 'error' && !scanResult && (
            <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center space-y-2.5 z-20">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-[11px] text-slate-200 leading-snug px-2">
                {cameraErrorMessage || 'Camera access is required to scan QR codes.'}
              </p>
              <button
                type="button"
                onClick={startCameraStream}
                className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-md cursor-pointer transition-colors active:scale-95"
              >
                Allow Camera / Retry
              </button>
            </div>
          )}

          {/* Reticle / Viewfinder Frame when running */}
          {cameraState === 'running' && !scanResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-10">
              <div className="w-full h-full border-2 border-dashed border-white/40 rounded-2xl animate-pulse" />
            </div>
          )}

          {/* Success Result Overlay */}
          {scanResult && (
            <div className="absolute inset-0 bg-slate-950/95 p-4 flex flex-col items-center justify-center text-center space-y-2.5 z-30">
              <span className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-base shadow-lg">
                ✓
              </span>
              <p className="text-xs font-bold text-emerald-400">Scanned Successfully!</p>
              <p className="text-[10px] text-slate-300 font-mono break-all max-w-[220px] bg-slate-900 p-2 rounded-xl border border-slate-800">
                {scanResult}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClearScan();
                  startCameraStream();
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-[11px] font-bold rounded-lg hover:text-white cursor-pointer"
              >
                Scan Another
              </button>
            </div>
          )}
        </div>

        {/* Demo Triggers for testing */}
        <div className="flex gap-2 justify-center mt-3 pt-1">
          <button
            type="button"
            onClick={onTriggerFriendDemo}
            className="px-2.5 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold tracking-tight transition-colors cursor-pointer border border-slate-300"
          >
            Demo Friend
          </button>
          <button
            type="button"
            onClick={onTriggerBoothDemo}
            className="px-2.5 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold tracking-tight transition-colors cursor-pointer border border-slate-300"
          >
            Demo Booth
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ScannerCameraModule;
