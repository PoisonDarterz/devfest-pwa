import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
import GdgKlLogo from '../common/GdgKlLogo';
import { ArrowLeftIcon } from '../common/Icons';

interface ScannerCameraModuleProps {
  scanResult: string | null;
  onScanResult: (decodedText: string) => void;
  onClearScan: () => void;
  onBackToBadge: () => void;
  onTriggerFriendDemo: () => void;
  onTriggerBoothDemo: () => void;
}

export const ScannerCameraModule: React.FC<ScannerCameraModuleProps> = ({
  scanResult,
  onScanResult,
  onClearScan,
  onBackToBadge,
  onTriggerFriendDemo,
  onTriggerBoothDemo,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-camera-viewfinder',
        { fps: 10, qrbox: { width: 220, height: 220 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          onScanResult(decodedText);
          scanner.clear();
        },
        (error) => {
          console.warn('QR Camera scan info:', error);
        }
      );

      scannerRef.current = scanner;
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScanResult]);

  return (
    <motion.div
      key="scan-qr-2"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col items-center justify-between grow space-y-4 py-1"
    >
      <div className="w-full grow flex flex-col items-center justify-center space-y-4 my-auto">
        <div className="w-full max-w-[280px] h-[280px] bg-[#2B2C32] rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl relative flex items-center justify-center">
          <div id="qr-camera-viewfinder" className="w-full h-full object-cover"></div>

          {!scanResult && (
            <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-3xl flex items-center justify-center">
              <div className="w-44 h-44 border-2 border-dashed border-white/40 rounded-2xl animate-pulse"></div>
            </div>
          )}

          {scanResult && (
            <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center space-y-3">
              <span className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-lg shadow-lg">✓</span>
              <p className="text-xs font-bold text-emerald-400">Scanned Successfully!</p>
              <p className="text-[11px] text-slate-300 font-mono break-all max-w-[240px] bg-slate-900 p-2 rounded-xl border border-slate-800">
                {scanResult}
              </p>
              <button
                onClick={onClearScan}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer"
              >
                Scan Another
              </button>
            </div>
          )}
        </div>

        {/* Demo Previews for Scan Trigger */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={onTriggerFriendDemo}
            className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[11px] font-bold rounded-lg cursor-pointer"
          >
            Demo Friend Discovery
          </button>
          <button
            onClick={onTriggerBoothDemo}
            className="px-3 py-1.5 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 border border-yellow-500/40 text-[11px] font-bold rounded-lg cursor-pointer"
          >
            Demo Booth Discovery
          </button>
        </div>

        <p className="text-xs italic text-slate-400 font-sans tracking-wide">
          Hold your camera over the QR code
        </p>
        <div className="pt-1">
          <GdgKlLogo />
        </div>
      </div>

      <div className="w-full flex items-center justify-center pt-2 pb-2">
        <button
          onClick={onBackToBadge}
          className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          aria-label="Back to My QR Pass"
        >
          <ArrowLeftIcon />
        </button>
      </div>
    </motion.div>
  );
};

export default ScannerCameraModule;
