import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  onTriggerFriendDemo,
  onTriggerBoothDemo,
  userName = 'Zixu Cheah',
  userRole = 'Software Engineer',
  qrPayload = 'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
  isNfcSupported,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
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
              // Haptic feedback
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
                if (text) {
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

  // Mount HTML5 QR Code camera scanner in bottom viewfinder
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-camera-viewfinder',
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            if (navigator.vibrate) navigator.vibrate(50);
            onScanResult(decodedText);
            scanner.clear().catch(() => {});
          },
          () => {
            // normal per-frame scan attempts
          }
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.warn('Camera scanner mount warning:', err);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScanResult]);

  // Handle interactive NFC bump trigger / test simulation
  const handleNfcBumpTap = () => {
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    setNfcBumpFeedback('NFC Bump Detected! Exchanging profiles...');
    setTimeout(() => {
      setNfcBumpFeedback(null);
      onTriggerFriendDemo();
    }, 900);
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
      {/* Top Header Bar with Close / Back Controls */}
      <div className="flex items-center justify-between px-3 pt-1 pb-1 z-30 shrink-0">
        <button
          type="button"
          onClick={onBackToBadge}
          className="p-1.5 rounded-full bg-slate-900/60 text-purple-200 hover:text-white transition-colors cursor-pointer border border-purple-400/20"
          title="Back to My QR Pass"
          aria-label="Back to My QR Pass"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-12 h-1 bg-purple-300/30 rounded-full" />

        <button
          type="button"
          onClick={onBackToBadge}
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
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-purple-900 animate-pulse" title="NFC Ready" />
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

          {/* Reticle / Viewfinder Frame */}
          {!scanResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-full h-full border-2 border-dashed border-white/30 rounded-2xl animate-pulse" />
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
                onClick={onClearScan}
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
