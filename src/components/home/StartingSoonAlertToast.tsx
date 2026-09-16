import React from 'react';
import { motion } from 'framer-motion';
import type { Session } from '../../lib/types';

interface StartingSoonAlertToastProps {
  alert: Session | null;
  onDismiss: () => void;
}

export const StartingSoonAlertToast: React.FC<StartingSoonAlertToastProps> = ({
  alert,
  onDismiss,
}) => {
  if (!alert) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="fixed top-4 left-4 right-4 z-[100] bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-blue-500/40 shadow-2xl flex items-start gap-3 text-white max-w-sm mx-auto"
    >
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
        <svg
          className="w-6 h-6 text-white animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
      <div className="grow space-y-1">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">
          Starting Soon
        </p>
        <h4 className="text-xs font-extrabold font-heading text-white">{alert.title}</h4>
        <p className="text-[10px] text-slate-300">
          Room: {alert.room} • Time: {alert.time}
        </p>
        <p className="text-[10px] text-slate-400">Speaker: {alert.speaker.name}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white cursor-pointer self-start"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};
