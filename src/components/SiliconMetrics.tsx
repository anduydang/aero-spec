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
  const coreCount = cpu.perCoreLoads.length || cpu.cores || 6;
  const gridColClass = coreCount <= 4 ? 'grid-cols-4' : coreCount <= 6 ? 'grid-cols-6' : coreCount <= 8 ? 'grid-cols-8' : 'grid-cols-12';

  return (
    <section className="col-span-12 xl:col-span-3 flex flex-col gap-4">
      
      {/* CPU Detailed Card */}
      <motion.div 
        whileHover={{ y: -2 }}
        onClick={() => onInspect('cpu')} 
        className="studio-card rounded-2xl p-4 flex flex-col gap-3 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 shadow-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs dark:text-white text-slate-900 group-hover:text-sky-500 transition">Processor Engine</span>
          </div>
          <span className="px-2 py-0.5 text-[11px] font-mono font-semibold dark:bg-sky-950 dark:text-sky-300 bg-sky-100 text-sky-800 rounded flex items-center gap-1">
            <span>Inspect</span> <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        <div>
          <h2 className="text-base font-extrabold dark:text-white text-slate-900 group-hover:text-sky-500 transition leading-snug">
            {cpu.name}
          </h2>
          <p className="text-xs dark:text-slate-400 text-slate-600 font-mono mt-1">
            {cpu.cores} Physical Cores • {cpu.threads} Threads • {cpu.cache}
          </p>
        </div>

        {/* Telemetry 4-Grid Clean Studio Typography */}
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="dark:bg-slate-900 bg-slate-50 p-2.5 rounded-xl border dark:border-slate-800 border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider">
              Avg Clock
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-extrabold dark:text-white text-slate-900">{cpu.avgClockMhz.toLocaleString()}</span>
              <span className="text-[10px] dark:text-slate-400 text-slate-500">MHz</span>
            </div>
          </div>

          <div className="dark:bg-slate-900 bg-slate-50 p-2.5 rounded-xl border dark:border-slate-800 border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider">
              Core Temp
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{cpu.tempC.toFixed(1)}</span>
              <span className="text-[10px] dark:text-slate-400 text-slate-500">°C</span>
            </div>
          </div>

          <div className="dark:bg-slate-900 bg-slate-50 p-2.5 rounded-xl border dark:border-slate-800 border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider">
              VCore
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-extrabold dark:text-amber-300 text-amber-600">{cpu.vcoreV.toFixed(3)}</span>
              <span className="text-[10px] dark:text-slate-400 text-slate-500">V</span>
            </div>
          </div>

          <div className="dark:bg-slate-900 bg-slate-50 p-2.5 rounded-xl border dark:border-slate-800 border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider">
              Power Draw
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-extrabold dark:text-indigo-300 text-indigo-600">{cpu.powerW.toFixed(1)}</span>
              <span className="text-[10px] dark:text-slate-400 text-slate-500">W</span>
            </div>
          </div>
        </div>

        {/* Dynamic Core Live Bars */}
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between items-center text-[11px] font-mono dark:text-slate-300 text-slate-700">
            <span className="font-bold">{perCoreLabel} ({coreCount} Cores)</span>
            <span className="text-sky-500 font-extrabold">
              Avg {Math.round(cpu.perCoreLoads.reduce((a, b) => a + b, 0) / (cpu.perCoreLoads.length || 1))}%
            </span>
          </div>
          <div className={`grid ${gridColClass} gap-1.5 h-8 dark:bg-slate-900 bg-slate-100 p-1 rounded-lg border dark:border-slate-800 border-slate-200 shadow-inner`}>
            {cpu.perCoreLoads.map((load, idx) => (
              <div key={idx} className="dark:bg-slate-800 bg-slate-200 rounded flex flex-col justify-end overflow-hidden">
                <div 
                  className="bg-sky-500 w-full transition-all duration-300 rounded-b" 
                  style={{ height: `${Math.max(8, load)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* RAM & Timings Card */}
      <motion.div 
        whileHover={{ y: -2 }}
        onClick={() => onInspect('ram')} 
        className="studio-card rounded-2xl p-4 flex flex-col gap-3 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs dark:text-white text-slate-900 group-hover:text-indigo-500 transition">Memory Array</span>
          </div>
          <span className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded ${
            ram.isSingleChannel 
              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
              : 'dark:bg-indigo-950 dark:text-indigo-300 bg-indigo-100 text-indigo-800'
          }`}>
            {ram.isSingleChannel ? 'SINGLE-CH' : 'DUAL-CHANNEL'}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-extrabold dark:text-white text-slate-900 group-hover:text-indigo-500 transition">
            {ram.totalGb}GB {ram.channelMode}
          </h3>
          <p className="text-xs dark:text-slate-400 text-slate-600 font-mono mt-0.5">
            {ram.frequencyMhz > 2000 ? `DDR5-${ram.frequencyMhz * 2}` : `DDR4-${ram.frequencyMhz}`} • {ram.die}
          </p>
        </div>

        {/* Timings Table */}
        <div className="dark:bg-slate-900 bg-slate-50 rounded-xl p-2.5 border dark:border-slate-800 border-slate-200 shadow-sm flex flex-col gap-1.5 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="dark:text-slate-400 text-slate-500 text-[11px]">Primary Timings:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{ram.primaryTimings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="dark:text-slate-400 text-slate-500 text-[11px]">Infinity Fabric (FCLK):</span>
            <span className="font-extrabold text-sky-500">{ram.fclkMhz} MHz (1:1)</span>
          </div>
        </div>

        {/* Single Channel Warning */}
        {ram.isSingleChannel && (
          <div className="text-[11px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Single-Channel Mode active. Bandwidth halved!</span>
          </div>
        )}
      </motion.div>

      {/* Thermal Solution Card */}
      <motion.div 
        whileHover={{ y: -2 }}
        onClick={() => onInspect('cooler')} 
        className="studio-card rounded-2xl p-3.5 flex flex-col gap-2.5 cursor-pointer group"
      >
        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center text-teal-500">
              <Fan className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs dark:text-white text-slate-900">Thermal Solution</span>
          </div>
          <span className="px-2 py-0.2 text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded">
            {cooler.type}
          </span>
        </div>

        <div className="flex items-center justify-between font-mono text-xs">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{cooler.name}</h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">PWM Pump: {cooler.pumpRpm.toLocaleString()} RPM</span>
          </div>
          <div className="text-right shrink-0">
            <span className="font-extrabold text-teal-600 dark:text-teal-400">{cooler.coolantTempC} °C</span>
            <span className="block text-[10px] text-slate-400">Coolant</span>
          </div>
        </div>
      </motion.div>

    </section>
  );
};
