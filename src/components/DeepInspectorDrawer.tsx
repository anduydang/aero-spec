import React from 'react';
import { X, Sparkles, Binary, Cpu, Layers, HardDrive, Monitor, Shield, Zap, Fan, Wifi, Tv, Mouse, Keyboard, Headphones, Plug2 } from 'lucide-react';
import type { InspectorItem, LanguageType } from '../types/hardware';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

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
  const dialogRef = useAccessibleDialog<HTMLElement>({ isOpen: Boolean(item), onClose });

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
          className="absolute inset-0 overlay-backdrop cursor-pointer"
        />

        {/* Drawer Panel with Spring Physics */}
        <motion.aside 
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspector-title"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="overlay-panel relative z-10 w-full max-w-2xl border-l p-6 overflow-y-auto flex flex-col gap-5"
        >
          {/* Drawer Header */}
          <div className="overlay-divider flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-500 shadow-md">
                {renderIcon(item.icon)}
              </div>
              <div>
                <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 dark:bg-sky-950 dark:text-sky-300 bg-sky-100 text-sky-800 border border-sky-300 rounded shadow-sm">
                  {item.badge}
                </span>
                <h2 id="inspector-title" className="text-lg font-black theme-title mt-1">{item.title}</h2>
              </div>
            </div>
            <button 
              onClick={onClose} 
              aria-label={lang === 'EN' ? 'Close component inspector' : 'Đóng trình kiểm tra linh kiện'}
              className="overlay-icon-button w-9 h-9 flex items-center justify-center transition cursor-pointer shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Deterministic local component analysis */}
          <div className="overlay-accent-card p-4 shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="font-extrabold text-xs theme-title">
                  Local compatibility analysis
                </h3>
              </div>
              <span className="text-xs font-mono font-extrabold px-2 py-0.5 dark:bg-indigo-950 dark:text-indigo-300 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded shadow-sm">
                {item.aiScore}
              </span>
            </div>
            <p className="text-xs theme-sub leading-relaxed font-sans font-medium">
              {lang === 'EN' ? item.aiText_EN : item.aiText_VI}
            </p>
          </div>

          {/* MICRO-SPECS TABBED CONTAINER */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="overlay-divider flex items-center justify-between border-b pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-500 flex items-center gap-1.5">
                <Binary className="w-4 h-4" /> {lowLevelTitle}
              </span>
              <span className="text-xs font-mono theme-muted font-bold">Direct HW Sensors</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              {item.specs.map((s, idx) => (
                <div key={idx} className="overlay-inset p-2.5 rounded-xl border flex flex-col justify-between shadow-sm">
                  <span className="text-[11px] theme-muted font-bold">{s.label}</span>
                  <span className="text-xs font-black theme-title mt-0.5">{s.val}</span>
                </div>
              ))}
            </div>

            {/* Extra Technical Architecture Section */}
            <div className="overlay-inset rounded-xl p-3.5 border mt-1 flex flex-col gap-2 shadow-sm">
              <h4 className="text-xs font-bold theme-title uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-500" /> {archTitle}
              </h4>
              <div className="text-xs theme-sub leading-relaxed font-mono">
                {lang === 'EN' ? item.arch_EN : item.arch_VI}
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
