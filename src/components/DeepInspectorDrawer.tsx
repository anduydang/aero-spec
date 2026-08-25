import React, { useEffect } from 'react';
import { X, Sparkles, Binary, Cpu, Layers, HardDrive, Monitor, Shield, Zap, Fan, Wifi, Tv, Mouse, Keyboard, Headphones, Plug2 } from 'lucide-react';
import type { InspectorItem, LanguageType } from '../types/hardware';
import { motion, AnimatePresence } from 'framer-motion';

interface DeepInspectorDrawerProps {
  item: InspectorItem | null;
  lang: LanguageType;
  lowLevelTitle: string;
  archTitle: string;
  onClose: () => void;
}

export const DeepInspectorDrawer: React.FC<DeepInspectorDrawerProps> = ({
  item,
  lang,
  lowLevelTitle,
  archTitle,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (item) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'cpu': return <Cpu className="w-6 h-6" />;
      case 'layers': return <Layers className="w-6 h-6" />;
      case 'hard-drive': return <HardDrive className="w-6 h-6" />;
      case 'monitor': return <Monitor className="w-6 h-6" />;
      case 'shield': return <Shield className="w-6 h-6" />;
      case 'zap': return <Zap className="w-6 h-6" />;
      case 'fan': return <Fan className="w-6 h-6" />;
      case 'wifi': return <Wifi className="w-6 h-6" />;
      case 'tv': return <Tv className="w-6 h-6" />;
      case 'mouse': return <Mouse className="w-6 h-6" />;
      case 'keyboard': return <Keyboard className="w-6 h-6" />;
      case 'headphones': return <Headphones className="w-6 h-6" />;
      default: return <Plug2 className="w-6 h-6" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex justify-end">
        {/* Backdrop Blur Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} 
          className="absolute inset-0 dark:bg-slate-950/80 bg-slate-900/60 backdrop-blur-md cursor-pointer"
        />

        {/* Drawer Panel with Spring Physics */}
        <motion.aside 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="relative z-10 w-full max-w-2xl dark:bg-slate-900 bg-white border-l dark:border-slate-800 border-slate-300 shadow-2xl p-6 overflow-y-auto flex flex-col gap-5 dark:text-slate-100 text-slate-900"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-500 shadow-md">
                {renderIcon(item.icon)}
              </div>
              <div>
                <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 dark:bg-sky-950 dark:text-sky-300 bg-sky-100 text-sky-800 border border-sky-300 rounded shadow-sm">
                  {item.badge}
                </span>
                <h2 className="text-lg font-black dark:text-white text-slate-900 mt-1">{item.title}</h2>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-9 h-9 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-750 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center border dark:border-slate-700 border-slate-300 transition cursor-pointer shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DEDICATED COMPONENT AI EVALUATION CARD */}
          <div className="dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-slate-850 dark:to-slate-900 bg-indigo-50 p-4 rounded-2xl border dark:border-indigo-500/40 border-indigo-200 shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="font-extrabold text-xs dark:text-white text-slate-900">
                  Gemini 3.7 Flash • Dedicated Component Verdict
                </h3>
              </div>
              <span className="text-xs font-mono font-extrabold px-2 py-0.5 dark:bg-indigo-950 dark:text-indigo-300 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded shadow-sm">
                {item.aiScore}
              </span>
            </div>
            <p className="text-xs dark:text-slate-200 text-slate-700 leading-relaxed font-sans font-medium">
              {lang === 'EN' ? item.aiText_EN : item.aiText_VI}
            </p>
          </div>

          {/* MICRO-SPECS TABBED CONTAINER */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-500 flex items-center gap-1.5">
                <Binary className="w-4 h-4" /> {lowLevelTitle}
              </span>
              <span className="text-xs font-mono dark:text-slate-400 text-slate-600 font-bold">Direct HW Sensors</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              {item.specs.map((s, idx) => (
                <div key={idx} className="dark:bg-slate-950 bg-slate-100 p-2.5 rounded-xl border dark:border-slate-800 border-slate-200 flex flex-col justify-between shadow-sm">
                  <span className="text-[11px] dark:text-slate-400 text-slate-600 font-bold">{s.label}</span>
                  <span className="text-xs font-black dark:text-white text-slate-900 mt-0.5">{s.val}</span>
                </div>
              ))}
            </div>

            {/* Extra Technical Architecture Section */}
            <div className="dark:bg-slate-950 bg-slate-50 rounded-xl p-3.5 border dark:border-slate-800 border-slate-200 mt-1 flex flex-col gap-2 shadow-sm">
              <h4 className="text-xs font-bold dark:text-white text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-500" /> {archTitle}
              </h4>
              <div className="text-xs dark:text-slate-300 text-slate-700 leading-relaxed font-mono">
                {lang === 'EN' ? item.arch_EN : item.arch_VI}
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
