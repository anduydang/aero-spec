import React from 'react';
import { Cpu, Layers, Fan, ArrowUpRight, AlertTriangle } from 'lucide-react';
import type { HardwareTelemetryState } from '../types/hardware';
import { motion } from 'framer-motion';

interface SiliconMetricsProps {
  telemetry: HardwareTelemetryState;
  onInspect: (id: string) => void;
  perCoreLabel: string;
}

export const SiliconMetrics: React.FC<SiliconMetricsProps> = ({
  telemetry,
  onInspect,
  perCoreLabel
}) => {
  const { cpu, ram, cooler } = telemetry;
  const { capabilities } = telemetry.telemetry;
  const coreCount = cpu.perCoreLoads.length || cpu.cores || 6;
  const gridColClass = coreCount <= 4 ? 'grid-cols-4' : coreCount <= 6 ? 'grid-cols-6' : coreCount <= 8 ? 'grid-cols-8' : 'grid-cols-12';

  if (!capabilities.cpuIdentity && !capabilities.ramIdentity) {
    return (
      <section className="order-2 xl:order-1">
        <div className="studio-card rounded-2xl p-5 flex flex-col gap-2 min-h-40 justify-center">
          <Cpu className="w-5 h-5 theme-primary-text" />
          <h2 className="text-sm font-black theme-title">CPU & memory data unavailable</h2>
          <p className="text-xs leading-relaxed theme-muted">
            Live WMI detection runs in the AeroSpec desktop app. Browser preview never fills these cards with simulated values.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="order-2 xl:order-1 flex flex-col gap-3">
      
      {/* CPU Detailed Card */}
      <motion.div 
        whileHover={{ y: -1 }}
        onClick={() => onInspect('cpu')} 
        className="studio-card rounded-2xl p-3 flex flex-col gap-2 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg theme-badge-primary flex items-center justify-center shadow-sm">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs theme-title group-hover:theme-primary-text transition">Processor Engine</span>
          </div>
          <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold theme-badge-primary rounded flex items-center gap-0.5">
            <span>Inspect</span> <ArrowUpRight className="w-2.5 h-2.5" />
          </span>
        </div>

        <div>
          <h2 className="text-xs font-black theme-title group-hover:theme-primary-text transition leading-snug">
            {cpu.name}
          </h2>
          <p className="text-[10px] theme-muted font-mono mt-0.5">
            {cpu.cores} Cores • {cpu.threads} Threads • {cpu.cache}
          </p>
        </div>

        {/* Telemetry 4-Grid Clean Studio Typography */}
        {capabilities.cpuSensors ? <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
          <div className="theme-chip-box p-1.5 px-2 rounded-lg shadow-sm flex flex-col justify-between">
            <span className="text-[9px] theme-muted font-bold uppercase tracking-wider">
              Avg Clock
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-black theme-title">{cpu.avgClockMhz.toLocaleString()}</span>
              <span className="text-[9px] theme-muted">MHz</span>
            </div>
          </div>

          <div className="theme-chip-box p-1.5 px-2 rounded-lg shadow-sm flex flex-col justify-between">
            <span className="text-[9px] theme-muted font-bold uppercase tracking-wider">
              Core Temp
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{cpu.tempC.toFixed(1)}</span>
              <span className="text-[9px] theme-muted">°C</span>
            </div>
          </div>

          <div className="theme-chip-box p-1.5 px-2 rounded-lg shadow-sm flex flex-col justify-between">
            <span className="text-[9px] theme-muted font-bold uppercase tracking-wider">
              VCore
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-black text-amber-600 dark:text-amber-300">{cpu.vcoreV.toFixed(3)}</span>
              <span className="text-[9px] theme-muted">V</span>
            </div>
          </div>

          <div className="theme-chip-box p-1.5 px-2 rounded-lg shadow-sm flex flex-col justify-between">
            <span className="text-[9px] theme-muted font-bold uppercase tracking-wider">
              Power Draw
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-black theme-secondary-text">{cpu.powerW.toFixed(1)}</span>
              <span className="text-[9px] theme-muted">W</span>
            </div>
          </div>
        </div> : (
          <div className="theme-chip-box rounded-xl p-2.5 text-xs theme-muted leading-relaxed">
            Temperature, voltage, and package-power sensors are unavailable through the native WMI probe.
          </div>
        )}

        {/* Dynamic Core Live Bars */}
        {capabilities.cpuLoad && <div className="flex flex-col gap-1 mt-0.5">
          <div className="flex justify-between items-center text-[10px] font-mono theme-title">
            <span className="font-bold">{perCoreLabel} ({coreCount} Cores)</span>
            <span className="theme-primary-text font-extrabold">
              Avg {Math.round(cpu.perCoreLoads.reduce((a, b) => a + b, 0) / (cpu.perCoreLoads.length || 1))}%
            </span>
          </div>
          <div className={`grid ${gridColClass} gap-1 h-6 theme-chip-box p-0.5 rounded-lg shadow-inner`}>
            {cpu.perCoreLoads.map((load, idx) => (
              <div key={idx} className="bg-black/5 dark:bg-slate-800 rounded flex flex-col justify-end overflow-hidden">
                <div 
                  className="theme-btn-primary w-full transition-all duration-300 rounded-b" 
                  style={{ height: `${Math.max(10, load)}%` }}
                />
              </div>
            ))}
          </div>
        </div>}
      </motion.div>

      {/* RAM & Timings Card */}
      <motion.div 
        whileHover={{ y: -1 }}
        onClick={() => onInspect('ram')} 
        className="studio-card rounded-2xl p-3 flex flex-col gap-2 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg theme-badge-secondary flex items-center justify-center shadow-sm">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs theme-title group-hover:theme-secondary-text transition">Memory Array</span>
          </div>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded ${
            ram.isSingleChannel 
              ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' 
              : 'theme-badge-secondary'
          }`}>
            {ram.isSingleChannel ? 'SINGLE-CH' : 'DUAL-CHANNEL'}
          </span>
        </div>

        <div>
          <h3 className="text-xs font-black theme-title group-hover:theme-secondary-text transition">
            {ram.totalGb}GB {ram.channelMode}
          </h3>
          <p className="text-[10px] theme-muted font-mono mt-0.5">
            {ram.frequencyMhz > 2000 ? `DDR5-${ram.frequencyMhz * 2}` : `DDR4-${ram.frequencyMhz}`} • {ram.die}
          </p>
        </div>

        {/* Timings Table */}
        {capabilities.ramTimings ? <div className="theme-chip-box rounded-lg p-2 shadow-sm flex flex-col gap-1 font-mono text-[10px]">
          <div className="flex justify-between items-center">
            <span className="theme-muted">Primary Timings:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{ram.primaryTimings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="theme-muted">Infinity Fabric (FCLK):</span>
            <span className="font-extrabold theme-primary-text">{ram.fclkMhz} MHz (1:1)</span>
          </div>
        </div> : (
          <div className="theme-chip-box rounded-xl p-2.5 text-xs theme-muted">
            Detailed timings and fabric clock are not exposed by WMI.
          </div>
        )}

        {/* Single Channel Warning */}
        {ram.isSingleChannel && (
          <div className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Single-Channel Mode (Bandwidth halved)</span>
          </div>
        )}
      </motion.div>

      {/* Thermal Solution Card */}
      {capabilities.cpuSensors ? <motion.div
        whileHover={{ y: -1 }}
        onClick={() => onInspect('cooler')} 
        className="studio-card rounded-2xl p-2.5 flex flex-col gap-1.5 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b border-black/5 dark:border-slate-800 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Fan className="w-3 h-3" />
            </div>
            <span className="font-bold text-xs theme-title">Thermal Solution</span>
          </div>
          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 rounded">
            {cooler.type}
          </span>
        </div>

        <div className="flex items-center justify-between font-mono text-[10px]">
          <div className="min-w-0">
            <h4 className="font-bold theme-title truncate">{cooler.name}</h4>
            <span className="theme-muted">PWM Pump: {cooler.pumpRpm.toLocaleString()} RPM</span>
          </div>
          <div className="text-right shrink-0">
            <span className="font-extrabold text-teal-600 dark:text-teal-400">{cooler.coolantTempC} °C</span>
            <span className="block text-[9px] theme-muted">Coolant</span>
          </div>
        </div>
      </motion.div> : (
        <div className="studio-card rounded-2xl p-3 text-xs theme-muted">
          Cooler telemetry is unavailable through WMI.
        </div>
      )}

    </section>
  );
};
