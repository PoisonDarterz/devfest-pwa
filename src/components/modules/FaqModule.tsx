import React from 'react';
import { motion } from 'framer-motion';
import mapSvg from '../../assets/map.svg';
import faqSvg from '../../assets/faq.svg';
import gdgBwSvg from '../../assets/gdg-bw.svg';
import { ArrowLeftIcon } from '../common/Icons';

interface FaqModuleProps {
  onOpenDialog: (dialogType: 'venue_map' | 'faq' | 'about_gdg') => void;
  onBackToHome: () => void;
}

export const FaqModule: React.FC<FaqModuleProps> = ({ onOpenDialog, onBackToHome }) => {
  return (
    <motion.div
      key="faq-sheet"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col grow justify-between space-y-4 overflow-y-auto scrollbar-none pt-4 pb-2 px-1"
    >
      {/* 3 NAVIGATION CARDS AS SHOWN IN THE SCREENSHOT */}
      <div className="space-y-4 my-auto">
        {/* CARD 1: Venue Map */}
        <div
          onClick={() => onOpenDialog('venue_map')}
          className="bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 border-4 border-[#DED7C9] flex items-center justify-between shadow-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <div className="space-y-1 pr-2">
            <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight leading-tight">
              Venue Map
            </h3>
          </div>
          <div className="w-24 h-24 rounded-2xl bg-[#ADC8FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-300/40">
            <img src={mapSvg} alt="Venue Map" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* CARD 2: Frequently Asked */}
        <div
          onClick={() => onOpenDialog('faq')}
          className="bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 border-4 border-[#DED7C9] flex items-center justify-between shadow-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <div className="space-y-1 pr-2">
            <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight leading-tight">
              Frequently<br />Asked
            </h3>
          </div>
          <div className="w-24 h-24 rounded-2xl bg-[#ADC8FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-300/40">
            <img src={faqSvg} alt="Frequently Asked" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* CARD 3: DevFest Sponsors */}
        <div
          onClick={() => onOpenDialog('about_gdg')}
          className="bg-[#ECE6DA] text-slate-900 rounded-[28px] p-5 border-4 border-[#DED7C9] flex items-center justify-between shadow-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <div className="space-y-1 pr-2">
            <h3 className="font-heading font-extrabold text-2xl text-slate-950 tracking-tight leading-tight">
              DevFest<br />Sponsors
            </h3>
          </div>
          <div className="w-24 h-24 rounded-2xl bg-[#ADC8FF] flex items-center justify-center shrink-0 shadow-sm border border-blue-300/40">
            <img src={gdgBwSvg} alt="DevFest Sponsors" className="w-13 h-10 object-contain" />
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BACK BUTTON */}
      <div className="w-full flex items-center justify-center pt-2 pb-2">
        <button
          onClick={onBackToHome}
          className="w-14 h-14 rounded-full bg-[#ECE6DA] hover:bg-[#E2DBCF] text-[#1C1D21] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          aria-label="Back to Home"
        >
          <ArrowLeftIcon />
        </button>
      </div>
    </motion.div>
  );
};

export default FaqModule;
