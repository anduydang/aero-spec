import React from 'react';
import { Zap, Wifi, Plug2, Tv, Mouse, Keyboard, Headphones } from 'lucide-react';
import type { HardwareTelemetryState } from '../types/hardware';
import { motion } from 'framer-motion';

interface PsuAndPeripheralsProps {
  telemetry: HardwareTelemetryState;
  onInspect: (id: string) => void;
  peripheralsTitle: string;
}

export const PsuAndPeripherals: React.FC<PsuAndPeripheralsProps> = ({
  telemetry,
  onInspect,
  peripheralsTitle
}) => {
  const { psu, network, peripherals } = telemetry;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'tv': return <Tv className="w-3.5 h-3.5" />;
      case 'mouse': return <Mouse className="w-3.5 h-3.5" />;
      case 'keyboard': return <Keyboard className="w-3.5 h-3.5" />;
      case 'headphones': return <Headphones className="w-3.5 h-3.5" />;
      default: return <Plug2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <section className="col-span-12 xl:col-span-3 flex flex-col gap-4">
      
      {/* Power Supply Unit (PSU) Card */}
      <motion.div 
        whileHover={{ y: -2 }}
        onClick={() => onInspect('psu')} 
        className="studio-card rounded-2xl p-3.5 flex flex-col gap-2 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs dark:text-white text-slate-900">Power Delivery</span>
          </div>
          <span className="px-2 py-0.2 text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded">
            {psu.rating} • {psu.ratedWattage}W
          </span>
        </div>

        <div className="flex items-center justify-between font-mono text-xs">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{psu.name}</h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Load: {psu.currentLoadW}W ({psu.loadPct.toFixed(1)}%)</span>
          </div>
          <div className="text-right shrink-0">
            <span className="font-extrabold text-amber-600 dark:text-amber-400">+12V: {psu.rail12v.toFixed(2)}V</span>
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Zero-RPM</span>
          </div>
        </div>
      </motion.div>

      {/* Network Interface Card */}
      <motion.div 
        whileHover={{ y: -2 }}
        onClick={() => onInspect('network')} 
        className="studio-card rounded-2xl p-3.5 flex flex-col gap-2 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs dark:text-white text-slate-900">Network Interface</span>
          </div>
          <span className="px-2 py-0.2 text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
            Wi-Fi 6E
          </span>
        </div>

        <div className="flex items-center justify-between font-mono text-xs">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{network.name}</h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{network.linkSpeedMbps.toLocaleString()} Mbps • {network.band}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{network.pingMs} ms</span>
            <span className="block text-[10px] text-slate-400">Ping</span>
          </div>
        </div>
      </motion.div>

      {/* Connected Peripherals Group */}
      <div className="studio-card rounded-2xl p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Plug2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs dark:text-white text-slate-900">{peripheralsTitle}</span>
          </div>
          <span className="px-2 py-0.2 text-[10px] font-mono font-bold dark:bg-sky-950 dark:text-sky-300 bg-sky-100 text-sky-800 rounded">
            {peripherals.length} Devices
          </span>
        </div>

        {/* Peripherals List */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-1">
          {peripherals.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ x: 2 }}
              onClick={() => onInspect(p.id)}
              className="dark:bg-slate-900 bg-white hover:border-sky-400 transition p-2.5 rounded-xl border dark:border-slate-800 border-slate-200 tactile-chip flex items-center justify-between gap-2.5 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
                  {renderIcon(p.icon)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold dark:text-white text-slate-900 group-hover:text-sky-500 truncate">{p.name}</h4>
                  <p className="text-[10px] font-mono dark:text-slate-300 text-slate-600 truncate">{p.detail}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0 text-right">{p.spec}</span>
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
};
