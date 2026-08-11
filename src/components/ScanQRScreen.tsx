import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Import Real Figma Sticker Assets from src/assets
import pinkFlower from '../assets/pink-flower.svg';
import bluePlus from '../assets/blue-plus.svg';
import redHeart from '../assets/red-heart.svg';
import gdgklLogo from '../assets/GDGKL-logo.png';
import gdgklText from '../assets/GDGKL-text.png';

interface ScanQRScreenProps {
  onBackToHome?: () => void;
}

// GDG KL Branding Logo Component
const GdgKlLogo = ({ className = "h-5" }: { className?: string }) => (
  <div className="flex items-center gap-2 justify-center py-0.5">
    <img src={gdgklLogo} alt="GDG Logo" className={`${className} w-auto object-contain shrink-0`} />
    <img src={gdgklText} alt="GDG Kuala Lumpur" className={`${className === "h-5" ? "h-4" : "h-5"} w-auto object-contain shrink-0`} />
  </div>
);

// Icons
const QrIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="3" height="3" />
    <path d="M18 14v3h3v4h-4v-3" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const ScanQRScreen: React.FC<ScanQRScreenProps> = ({ onBackToHome }) => {
  // Mode State: 'my_qr' (Scan QR 1) vs 'camera_scan' (Scan QR 2)
  const [mode, setMode] = useState<'my_qr' | 'camera_scan'>('my_qr');
  const [scanResult, setScanResult] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (mode !== 'camera_scan') return;

    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-camera-viewfinder',
        { fps: 10, qrbox: { width: 220, height: 220 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
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
  }, [mode]);

  return (
    <div className="min-h-screen bg-[#3B9E59] text-slate-900 flex flex-col items-center justify-start overflow-x-hidden font-sans">
      {/* Mobile Container Viewport */}
      <div className="w-full max-w-md min-h-screen flex flex-col justify-between relative shadow-2xl">
        
        {/* TOP SECTION: Green Header Bar */}
        <div className="p-5 pt-6 space-y-4 relative">
          
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          {/* App Header Bar: DevFest Logo & Profile Avatar */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <img src={gdgklLogo} alt="GDG Logo" className="h-7 w-auto object-contain shrink-0" />
              <h1 className="font-heading font-black text-2xl text-slate-950 tracking-tight">
                DevFest
              </h1>
              <span className="bg-[#F7B033] text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-black/10 shadow-sm">
                2026
              </span>
            </div>

            {/* Profile Avatar */}
            <button
              onClick={onBackToHome}
              className="w-10 h-10 rounded-full border-2 border-emerald-900 overflow-hidden bg-slate-200 shadow-md transition-transform active:scale-95 cursor-pointer"
              aria-label="Back to Home"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="User Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* MAIN DARK CONTAINER SHEET */}
        <div className="bg-[#1C1D21] text-slate-100 rounded-t-[32px] p-5 pt-3 space-y-5 border-t border-slate-800 shadow-2xl relative grow flex flex-col justify-between">
          
          {/* Sheet Handle */}
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto shrink-0"></div>

          {/* MODE 1: MY QR BADGE (Scan QR 1) */}
          {mode === 'my_qr' && (
            <div className="flex flex-col items-center justify-between grow space-y-6">
              
              {/* Top Stickers Layer (Pink Flower, Blue Plus, Red Heart) */}
              <div className="relative w-full max-w-[280px] pt-4">
                {/* Pink Flower Sticker Asset */}
                <div className="absolute -top-5 left-5 z-10 transform -rotate-12 pointer-events-none">
                  <img src={pinkFlower} alt="Pink Flower" className="w-12 h-12 drop-shadow-lg" />
                </div>
                {/* Blue Plus Sticker Asset */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 transform rotate-6 pointer-events-none">
                  <img src={bluePlus} alt="Blue Plus" className="w-14 h-14 drop-shadow-lg" />
                </div>
                {/* Red Heart Sticker Asset */}
                <div className="absolute -top-5 right-5 z-10 transform rotate-12 pointer-events-none">
                  <img src={redHeart} alt="Red Heart" className="w-12 h-12 drop-shadow-lg" />
                </div>

                {/* Main Pass Badge Card */}
                <div className="relative bg-[#ECE6DA] text-slate-900 rounded-[28px] p-6 shadow-2xl border-4 border-[#DED7C9] text-center space-y-5">
                  
                  {/* Top DevFest Badge Header */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <span className="font-heading font-black text-lg text-slate-950 tracking-tight">
                      DevFest
                    </span>
                    <span className="bg-[#F7B033] text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-black/10">
                      2026
                    </span>
                  </div>

                  {/* QR Code Matrix Display */}
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-inner border border-slate-200">
                    <QRCodeSVG
                      value="DEVFEST-KL-2026-ZIXU-CHEAH-SW"
                      size={180}
                      level="H"
                    />
                  </div>

                  {/* Name & Role Details */}
                  <div className="space-y-1">
                    <h2 className="font-heading font-bold text-2xl text-slate-950 tracking-tight">
                      Zixu Cheah
                    </h2>
                    <p className="text-xs font-semibold text-slate-600">
                      Software Engineer
                    </p>
                  </div>

                  {/* Bottom GDG KL Branding */}
                  <div className="pt-2 border-t border-slate-300/60">
                    <GdgKlLogo />
                  </div>
                </div>
              </div>

              {/* Bottom Action Controls: [Scan QR] & [Download] */}
              <div className="w-full flex items-center justify-center gap-3 pt-2 pb-4">
                <button
                  onClick={() => setMode('camera_scan')}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <QrIcon />
                  <span>Scan QR</span>
                </button>

                <button
                  onClick={() => alert('Saved DevFest KL Pass to your photos/downloads!')}
                  className="w-12 h-12 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
                  aria-label="Download Badge"
                >
                  <DownloadIcon />
                </button>
              </div>

            </div>
          )}

          {/* MODE 2: CAMERA SCANNER (Scan QR 2) */}
          {mode === 'camera_scan' && (
            <div className="flex flex-col items-center justify-between grow space-y-6">
              
              {/* Camera Viewfinder Box */}
              <div className="w-full grow flex flex-col items-center justify-center space-y-4 my-auto">
                <div className="w-full max-w-[300px] h-[300px] bg-[#2B2C32] rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl relative flex items-center justify-center">
                  
                  <div id="qr-camera-viewfinder" className="w-full h-full object-cover"></div>

                  {!scanResult && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-3xl flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-dashed border-white/40 rounded-2xl animate-pulse"></div>
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
                        onClick={() => setScanResult(null)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        Scan Another
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs italic text-slate-400 font-sans tracking-wide">
                  Hold your camera over the QR code
                </p>
                <div className="pt-1">
                  <GdgKlLogo />
                </div>
              </div>

              {/* Bottom Navigation Back Button */}
              <div className="w-full flex items-center justify-center pt-2 pb-4">
                <button
                  onClick={() => setMode('my_qr')}
                  className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                  aria-label="Back to My QR Pass"
                >
                  <ArrowLeftIcon />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ScanQRScreen;
