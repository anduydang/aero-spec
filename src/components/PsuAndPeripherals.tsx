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
  const { capabilities } = telemetry.telemetry;

  if (!capabilities.psu && !capabilities.network && !capabilities.peripherals) {
    return (
      <section className="order-3">
        <div className="studio-card rounded-2xl p-5 flex flex-col gap-2 min-h-40 justify-center">
          <Plug2 className="w-5 h-5 theme-primary-text" />
          <h2 className="text-sm font-black theme-title">Power & connected devices unavailable</h2>
          <p className="text-xs leading-relaxed theme-muted">
            Windows WMI does not provide reliable PSU, ping, or peripheral telemetry. AeroSpec leaves these fields empty.
          </p>
        </div>
      </section>
    );
  }

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
    <section className="order-3 flex flex-col gap-3">
      
      {/* Power Supply Unit (PSU) Card */}
      <motion.div 
        whileHover={{ y: -1 }}
        onClick={() => onInspect('psu')} 
        className="studio-card rounded-2xl p-3 flex flex-col gap-2 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs theme-title">Power Delivery</span>
          </div>
          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded">
            {psu.rating} • {psu.ratedWattage}W
          </span>
        </div>

        <div className="flex items-center justify-between font-mono text-xs">
          <div className="min-w-0">
            <h4 className="font-bold theme-title text-xs truncate">{psu.name}</h4>
            <span className="text-[10px] theme-muted">Load: {psu.currentLoadW}W ({psu.loadPct.toFixed(1)}%)</span>
          </div>
          <div className="text-right shrink-0">
            <span className="font-extrabold text-amber-600 dark:text-amber-400">+12V: {psu.rail12v.toFixed(2)}V</span>
            <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Zero-RPM</span>
          </div>
        </div>
      </motion.div>

      {/* Network Interface Card */}
      <motion.div 
        whileHover={{ y: -1 }}
        onClick={() => onInspect('network')} 
        className="studio-card rounded-2xl p-3 flex flex-col gap-2 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs theme-title">Network Interface</span>
          </div>
          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded">
            Wi-Fi 6E
          </span>
        </div>

        <div className="flex items-center justify-between font-mono text-xs">
          <div className="min-w-0">
            <h4 className="font-bold theme-title text-xs truncate">{network.name}</h4>
            <span className="text-[10px] theme-muted">{network.linkSpeedMbps.toLocaleString()} Mbps • {network.band}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{network.pingMs} ms</span>
            <span className="block text-[9px] theme-muted">Ping</span>
          </div>
        </div>
      </motion.div>

      {/* Connected Peripherals Group */}
      <div className="studio-card rounded-2xl p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md theme-badge-primary flex items-center justify-center">
              <Plug2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs theme-title">{peripheralsTitle}</span>
          </div>
          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold theme-badge-primary rounded">
            {peripherals.length} Devices
          </span>
        </div>

        {/* Peripherals List */}
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px] 2xl:max-h-[280px] pr-1">
          {peripherals.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ x: 2 }}
              onClick={() => onInspect(p.id)}
              className="theme-chip-box p-2 rounded-xl tactile-chip flex items-center justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md theme-badge-primary flex items-center justify-center shrink-0">
                  {renderIcon(p.icon)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold theme-title group-hover:theme-primary-text truncate">{p.name}</h4>
                  <p className="text-[9px] font-mono theme-muted truncate">{p.detail}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0 text-right">{p.spec}</span>
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
};
