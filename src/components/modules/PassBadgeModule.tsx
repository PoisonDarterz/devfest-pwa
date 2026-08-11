import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import pinkFlower from '../../assets/pink-flower.svg';
import bluePlus from '../../assets/blue-plus.svg';
import redHeart from '../../assets/red-heart.svg';
import GdgKlLogo from '../common/GdgKlLogo';
import { QrScanIcon, DownloadIcon } from '../common/Icons';

interface PassBadgeModuleProps {
  userName?: string;
  userRole?: string;
  qrPayload?: string;
  onOpenScanner: () => void;
}

export const PassBadgeModule: React.FC<PassBadgeModuleProps> = ({
  userName = 'Zixu Cheah',
  userRole = 'Software Engineer',
  qrPayload = 'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
  onOpenScanner,
}) => {
  return (
    <motion.div
      key="scan-qr-1"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col items-center justify-between grow space-y-4 overflow-y-auto scrollbar-none pt-12 pb-1"
    >
      <div className="relative w-full max-w-[280px] pt-4 my-auto">
        <div className="absolute -top-3 -left-3 z-10 transform -rotate-12 pointer-events-none">
          <img src={pinkFlower} alt="Pink Flower" className="w-13 h-13 drop-shadow-lg" />
        </div>
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 transform rotate-6 pointer-events-none">
          <img src={bluePlus} alt="Blue Plus" className="w-14 h-14 drop-shadow-lg" />
        </div>
        <div className="absolute -top-4 -right-3 z-10 transform rotate-12 pointer-events-none">
          <img src={redHeart} alt="Red Heart" className="w-13 h-13 drop-shadow-lg" />
        </div>

        {/* Main Pass Card */}
        <div className="relative bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 shadow-2xl border-4 border-[#DED7C9] text-center space-y-4">
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="font-heading font-black text-lg text-slate-950 tracking-tight">
              DevFest
            </span>
            <span className="bg-[#F7B033] text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-black/10">
              2026
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-2xl inline-block shadow-inner border border-slate-200">
            <QRCodeSVG value={qrPayload} size={170} level="H" />
          </div>

          <div className="space-y-0.5">
            <h2 className="font-heading font-bold text-2xl text-slate-950 tracking-tight">
              {userName}
            </h2>
            <p className="text-xs font-semibold text-slate-600">
              {userRole}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-300/60">
            <GdgKlLogo />
          </div>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full flex items-center justify-center gap-3 pt-2 pb-2">
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <QrScanIcon />
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
    </motion.div>
  );
};

export default PassBadgeModule;
