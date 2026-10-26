import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeftIcon } from '../common/Icons';
import pinkFlower from '../../assets/pink-flower.svg';
import bluePlus from '../../assets/blue-plus.svg';
import redHeart from '../../assets/red-heart.svg';
interface ScannerCameraModuleProps {
  scanResult: string | null;
  onScanResult: (decodedText: string) => void;
  onClearScan: () => void;
  onBackToBadge: () => void;
  onTriggerBoothDemo?: () => void;
  userName?: string;
  userRole?: string;
  qrPayload?: string;
}

export const ScannerCameraModule: React.FC<ScannerCameraModuleProps> = ({
  scanResult,
  onScanResult,
  onClearScan,
  onBackToBadge,
  onTriggerBoothDemo,
  userName = 'Zixu Cheah',
  userRole = 'Software Engineer',
  qrPayload = 'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
}) => {
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'running' | 'error'>('starting');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);

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
      {/* ================================================================= */}
      {/* 1. TOP PROMPT & BADGE PREVIEW                                     */}
      {/* ================================================================= */}
      <div className="grow flex flex-col items-center justify-start pt-3 pb-2 relative z-10 overflow-hidden">
        {/* Scan Badge Icon */}
        <div className="w-13 h-13 rounded-full border-2 border-purple-300/80 bg-purple-950/50 flex items-center justify-center text-purple-200 shadow-xl shadow-purple-900/50">
          <svg className="w-6 h-6 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>

        {/* Scan Badge Instructions Text */}
        <p className="font-serif italic text-purple-200/90 text-[13px] leading-snug text-center mt-2.5 max-w-[220px] mx-auto select-none">
          Scan attendee badge QR to exchange profiles
        </p>

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

        {/* Bottom Back Button & Demo Triggers */}
        <div className="flex items-center justify-center gap-3 mt-3 pt-1">
          <button
            type="button"
            onClick={handleExitScanner}
            className="w-13 h-13 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            aria-label="Back to Badge"
          >
            <ArrowLeftIcon className="w-5 h-5 text-[#1C1D21]" />
          </button>
          {onTriggerBoothDemo && (
            <button
              type="button"
              onClick={onTriggerBoothDemo}
              className="px-2.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold tracking-tight transition-colors cursor-pointer border border-slate-300"
            >
              Demo Booth
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ScannerCameraModule;
