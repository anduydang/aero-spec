import React, { useEffect, useRef } from 'react';
import { CircuitBoard, Cpu, Layers, HardDrive, Monitor, Shield, ArrowUpRight } from 'lucide-react';
import type { HardwareTelemetryState, ThemeType } from '../types/hardware';
import { motion } from 'framer-motion';

interface MotherboardSchematicProps {
  telemetry: HardwareTelemetryState;
  theme: ThemeType;
  onInspect: (id: string) => void;
}

export const MotherboardSchematic: React.FC<MotherboardSchematicProps> = ({
  telemetry,
  theme,
  onInspect,
}) => {
  const { motherboard, cpu, ram, storage, gpu } = telemetry;
  const svgRef = useRef<SVGSVGElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const nodeCpuRef = useRef<HTMLDivElement>(null);
  const nodeRamRef = useRef<HTMLDivElement>(null);
  const nodeNvme1Ref = useRef<HTMLDivElement>(null);
  const nodeNvme2Ref = useRef<HTMLDivElement>(null);
  const nodeGpuRef = useRef<HTMLDivElement>(null);

  const isIntel = cpu.name.toLowerCase().includes('intel');
  const socketLabel = isIntel ? 'LGA 1151 / 1700 SOCKET' : 'LGA 1718 SOCKET';
  const archFamily = isIntel ? 'Intel Core Processor' : 'AMD AM5 Core';
  const isDdr4 = ram.config.includes('DDR4');
  const busTypeLabel = isDdr4 
    ? (ram.isSingleChannel ? 'DDR4 SINGLE-CH' : 'DDR4 DUAL-CH')
    : (ram.isSingleChannel ? 'DDR5 SINGLE-CH' : 'DDR5 DUAL-CH');

  const drawBuses = () => {
    const svg = svgRef.current;
    const area = areaRef.current;
    if (!svg || !area) return;

    const areaRect = area.getBoundingClientRect();
    const cpuEl = nodeCpuRef.current;
    const ramEl = nodeRamRef.current;
    const nvme1El = nodeNvme1Ref.current;
    const nvme2El = nodeNvme2Ref.current;
    const gpuEl = nodeGpuRef.current;

    if (!cpuEl || !ramEl || !nvme1El || !gpuEl) return;

    const getPos = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - areaRect.left,
        top: r.top - areaRect.top,
        right: r.right - areaRect.left,
        bottom: r.bottom - areaRect.top,
        cx: r.left - areaRect.left + r.width / 2,
        cy: r.top - areaRect.top + r.height / 2,
        w: r.width,
        h: r.height
      };
    };

    const cCpu = getPos(cpuEl);
    const cRam = getPos(ramEl);
    const cNvme1 = getPos(nvme1El);
    const cNvme2 = nvme2El ? getPos(nvme2El) : null;
    const cGpu = getPos(gpuEl);

    const isDark = theme === 'slate';
    let copperBase = '#cbd5e1';
    let cyanBus = '#0284c7';
    let indigoBus = '#4338ca';
    let goldVia = '#d97706';

    if (theme === 'slate') {
      copperBase = '#1e293b';
      cyanBus = '#0ea5e9';
      indigoBus = '#6366f1';
      goldVia = '#fbbf24';
    } else if (theme === 'latte') {
      copperBase = '#d6c7b5';
      cyanBus = '#ea580c';
      indigoBus = '#9a3412';
      goldVia = '#b45309';
    } else if (theme === 'matcha') {
      copperBase = '#b8d7c4';
      cyanBus = '#059669';
      indigoBus = '#0d9488';
      goldVia = '#ca8a04';
    } else if (theme === 'sakura') {
      copperBase = '#e5c4de';
      cyanBus = '#db2777';
      indigoBus = '#9333ea';
      goldVia = '#e11d48';
    }

    let svgContent = '';

    // 1. RAM Multi-Lane Bus
    const ramOffsets = ram.isSingleChannel ? [-2, 2] : [-6, -2, 2, 6];
    ramOffsets.forEach((offset, idx) => {
      const y = cCpu.cy + offset * 3.5;
      svgContent += `
        <line x1="${cCpu.right}" y1="${y}" x2="${cRam.left}" y2="${y}" stroke="${copperBase}" stroke-width="2.5" />
        <line x1="${cCpu.right}" y1="${y}" x2="${cRam.left}" y2="${y}" stroke="${ram.isSingleChannel ? '#f59e0b' : cyanBus}" stroke-width="1.5" class="trace-bus-fast" style="animation-delay: ${idx * 0.2}s" />
        <circle cx="${cCpu.right + 3}" cy="${y}" r="2" fill="${goldVia}" />
        <circle cx="${cRam.left - 3}" cy="${y}" r="2" fill="${goldVia}" />
      `;
    });

    // 2. CPU to Storage 1
    const nvme1StartX = cCpu.left + cCpu.w * 0.25;
    const nvme1BendY = cNvme1.top - 12;
    [-3, 3].forEach(offset => {
      const sx = nvme1StartX + offset;
      const tx = cNvme1.cx + offset;
      svgContent += `
        <path d="M ${sx} ${cCpu.bottom} L ${sx} ${nvme1BendY} L ${tx} ${nvme1BendY} L ${tx} ${cNvme1.top}" 
              fill="none" stroke="${copperBase}" stroke-width="3" />
        <path d="M ${sx} ${cCpu.bottom} L ${sx} ${nvme1BendY} L ${tx} ${nvme1BendY} L ${tx} ${cNvme1.top}" 
              fill="none" stroke="${cyanBus}" stroke-width="1.5" class="trace-bus" />
        <circle cx="${tx}" cy="${cNvme1.top - 2}" r="2" fill="${goldVia}" />
      `;
    });

    // 3. CPU to Storage 2 (if populated)
    if (cNvme2) {
      const nvme2StartX = cCpu.right - cCpu.w * 0.25;
      const nvme2BendY = cNvme2.top - 12;
      const isPopulated = storage.m2_2.isPopulated;
      [-3, 3].forEach(offset => {
        const sx = nvme2StartX + offset;
        const tx = cNvme2.cx + offset;
        svgContent += `
          <path d="M ${sx} ${cCpu.bottom} L ${sx} ${nvme2BendY} L ${tx} ${nvme2BendY} L ${tx} ${cNvme2.top}" 
                fill="none" stroke="${copperBase}" stroke-width="3" opacity="${isPopulated ? '1' : '0.35'}" />
          ${isPopulated ? `
            <path d="M ${sx} ${cCpu.bottom} L ${sx} ${nvme2BendY} L ${tx} ${nvme2BendY} L ${tx} ${cNvme2.top}" 
                  fill="none" stroke="${cyanBus}" stroke-width="1.5" class="trace-bus" />
            <circle cx="${tx}" cy="${cNvme2.top - 2}" r="2" fill="${goldVia}" />
          ` : ''}
        `;
      });
    }

    // 4. PCIe x16 / Ring Bus GPU Ribbon
    const pcieOffsets = [-18, -12, -6, 0, 6, 12, 18];
    pcieOffsets.forEach((offset, idx) => {
      const x = cCpu.cx + offset;
      const startY = cNvme1.bottom + 4;
      const isDiscrete = gpu.isDiscrete;
      svgContent += `
        <line x1="${x}" y1="${startY}" x2="${x}" y2="${cGpu.top}" stroke="${copperBase}" stroke-width="2.5" opacity="${isDiscrete ? '1' : '0.4'}" />
        <line x1="${x}" y1="${startY}" x2="${x}" y2="${cGpu.top}" stroke="${isDiscrete ? indigoBus : cyanBus}" stroke-width="1.5" class="trace-bus-fast" style="animation-delay: ${idx * 0.15}s" />
        <circle cx="${x}" cy="${cGpu.top - 2}" r="2" fill="${goldVia}" opacity="1" />
      `;
    });

    const gpuLabel = gpu.isDiscrete ? 'PCIe 4.0 x16 [DIRECT CPU LINK]' : 'SYSTEM BUS [RING / iGPU ACTIVE]';
    const gpuLabelY = (cNvme1.bottom + cGpu.top) / 2;

    svgContent += `
      <g>
        <rect x="${cCpu.cx - 85}" y="${gpuLabelY - 7}" width="170" height="14" rx="4" fill="${isDark ? '#0b1120' : '#ffffff'}" stroke="${isDark ? '#1e293b' : '#cbd5e1'}" stroke-width="1" />
        <text x="${cCpu.cx}" y="${gpuLabelY + 3}" fill="${gpu.isDiscrete ? indigoBus : cyanBus}" font-family="Cascadia Code, JetBrains Mono, monospace" font-size="8" font-weight="bold" text-anchor="middle">${gpuLabel}</text>
      </g>
    `;

    svg.innerHTML = svgContent;
  };

  useEffect(() => {
    drawBuses();
    const ro = new ResizeObserver(() => drawBuses());
    if (areaRef.current) ro.observe(areaRef.current);
    window.addEventListener('resize', drawBuses);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', drawBuses);
    };
  }, [telemetry, theme]);

  return (
    <section className="col-span-12 xl:col-span-6 flex flex-col gap-2 h-full">
      <div className="studio-card rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 flex-1 relative overflow-hidden">
        
        {/* Board Header with BIOS Details */}
        <div 
          onClick={() => onInspect('mainboard')} 
          className="flex flex-wrap items-center justify-between gap-2 border-b dark:border-slate-800 border-slate-200 pb-2 cursor-pointer group z-10"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl dark:bg-slate-900 bg-slate-100 border dark:border-slate-700 border-slate-300 flex items-center justify-center text-sky-500 shadow-sm group-hover:border-sky-500 transition">
              <CircuitBoard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold dark:text-white text-slate-900 group-hover:text-sky-500 transition leading-none">{motherboard.name}</h2>
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 dark:bg-emerald-950 dark:text-emerald-300 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded shadow-sm">
                  BIOS: {motherboard.biosVersion}
                </span>
              </div>
              <p className="text-[10px] dark:text-slate-400 text-slate-500 font-mono mt-0.5 leading-none">
                {motherboard.chipset} • {motherboard.pcbLayers} • Date: {motherboard.biosDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 dark:bg-sky-950 dark:text-sky-300 bg-sky-100 text-sky-800 rounded text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
              <span>Inspect Board & BIOS</span> <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Realistic PCB Substrate Canvas */}
        <div 
          ref={areaRef}
          className="pcb-substrate rounded-2xl p-3 border dark:border-slate-800 border-slate-300 flex-1 flex flex-col justify-between min-h-[360px] gap-2.5 relative shadow-inner"
        >
          <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-0"></svg>

          {/* TOP ROW: VRM Heatsink & CPU Socket & DIMM Banks */}
          <div className="grid grid-cols-12 gap-2.5 z-10">
            
            {/* VRM Module */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => onInspect('vrm')} 
              className="col-span-4 dark:bg-slate-900 bg-white hover:border-amber-400 transition p-2.5 rounded-xl border dark:border-slate-800 border-slate-300 tactile-chip flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> VRM
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{motherboard.vrm.tempC} °C</span>
                </div>
                <div className="text-[11px] font-bold dark:text-slate-200 text-slate-800 mt-0.5 font-mono">{motherboard.vrm.phases}</div>
              </div>

              <div className="w-full dark:bg-slate-800 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-emerald-500 h-full" style={{ width: `${motherboard.vrm.mosfetLoadPct}%` }}></div>
              </div>
            </motion.div>

            {/* Socket Central Core */}
            <motion.div 
              ref={nodeCpuRef}
              whileHover={{ scale: 1.01 }}
              onClick={() => onInspect('cpu')} 
              className="col-span-4 dark:bg-sky-950/60 bg-sky-100/90 hover:border-sky-500 transition p-2.5 rounded-xl border-2 dark:border-sky-500/70 border-sky-400 tactile-chip flex flex-col items-center justify-center text-center relative group cursor-pointer"
            >
              <div className="absolute -top-2 px-1.5 py-0.2 dark:bg-sky-900 bg-sky-600 text-white rounded text-[8px] font-mono font-extrabold shadow-md">
                {socketLabel}
              </div>
              <Cpu className="w-6 h-6 text-sky-500 mb-0.5" />
              <span className="text-[11px] font-extrabold dark:text-white text-slate-900">{archFamily}</span>
              <span className="text-[10px] text-sky-700 dark:text-sky-300 font-mono font-bold truncate w-full">{cpu.name}</span>
            </motion.div>

            {/* DIMM Slot Bank */}
            <motion.div 
              ref={nodeRamRef}
              whileHover={{ scale: 1.01 }}
              onClick={() => onInspect('ram')} 
              className="col-span-4 dark:bg-slate-900 bg-white hover:border-indigo-400 transition p-2 rounded-xl border dark:border-slate-800 border-slate-300 tactile-chip flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> DIMM SLOTS
                </span>
                <span className={`text-[9px] font-mono font-extrabold px-1 py-0.2 rounded ${ram.isSingleChannel ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                  {busTypeLabel}
                </span>
              </div>

              {/* Slots */}
              <div className="grid grid-cols-4 gap-1 my-1">
                {ram.slots.map((s, idx) => (
                  <div 
                    key={idx}
                    className={`h-10 rounded border flex flex-col items-center justify-between p-0.5 text-[9px] font-mono font-bold ${
                      s.status === 'active' 
                        ? 'bg-indigo-600 border-indigo-400 shadow text-white' 
                        : 'dark:bg-slate-950 bg-slate-100 border-dashed dark:border-slate-800 border-slate-300 text-slate-400'
                    }`}
                  >
                    <span>{s.slot}</span>
                    <span className="text-[8px]">{s.status === 'active' ? s.size : '[EMPTY]'}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* MIDDLE ROW: Storage Bays (M.2 & SATA) */}
          <div className="grid grid-cols-12 gap-2.5 z-10">
            
            {/* Primary Disk M.2_1 */}
            <motion.div 
              ref={nodeNvme1Ref}
              whileHover={{ scale: 1.01 }}
              onClick={() => onInspect('nvme1')} 
              className="col-span-4 dark:bg-slate-900 bg-white hover:border-sky-400 transition p-2.5 rounded-xl border dark:border-slate-800 border-slate-300 tactile-chip cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-sky-500" /> DISK #1
                </span>
                <span className="text-[8px] font-mono font-bold px-1 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded">
                  ACTIVE
                </span>
              </div>
              <h4 className="text-[11px] font-bold dark:text-white text-slate-900 group-hover:text-sky-500 truncate mt-1">{storage.m2_1.name}</h4>
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-1">
                <span className="text-sky-500 font-bold">{storage.m2_1.speedRead}</span>
                <span>{storage.m2_1.tempC} °C</span>
              </div>
            </motion.div>

            {/* Secondary Disk M.2_2 */}
            <motion.div 
              ref={nodeNvme2Ref}
              whileHover={{ scale: 1.01 }}
              onClick={() => onInspect('nvme2')} 
              className={`col-span-4 transition p-2.5 rounded-xl border tactile-chip cursor-pointer group ${
                storage.m2_2.isPopulated 
                  ? 'dark:bg-slate-900 bg-white hover:border-sky-400 dark:border-slate-800 border-slate-300' 
                  : 'dark:bg-slate-950/40 bg-slate-100/60 border-dashed dark:border-slate-800 border-slate-300 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-indigo-500" /> DISK #2
                </span>
                <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded ${
                  storage.m2_2.isPopulated ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-700 text-slate-300'
                }`}>
                  {storage.m2_2.isPopulated ? 'ACTIVE' : 'EMPTY'}
                </span>
              </div>
              <h4 className="text-[11px] font-bold dark:text-white text-slate-900 group-hover:text-sky-500 truncate mt-1">
                {storage.m2_2.isPopulated ? storage.m2_2.name : 'Secondary Storage Bay'}
              </h4>
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-1">
                <span className="text-indigo-500 font-bold">{storage.m2_2.speedRead}</span>
                <span>{storage.m2_2.isPopulated ? `${storage.m2_2.tempC} °C` : '--'}</span>
              </div>
            </motion.div>

            {/* Storage Bay #3 */}
            <div className="col-span-4 dark:bg-slate-950/40 bg-slate-100/60 border-dashed dark:border-slate-800 border-slate-300 rounded-xl border p-2.5 flex flex-col justify-center items-center text-center opacity-60">
              <span className="text-[10px] font-bold text-slate-400">Storage Bay #3</span>
              <span className="text-[8px] text-slate-500 font-mono">[Available for Upgrade]</span>
            </div>

          </div>

          {/* BOTTOM ROW: Graphics Engine Card (PCIe / iGPU) */}
          <motion.div 
            ref={nodeGpuRef}
            whileHover={{ scale: 1.005 }}
            onClick={() => onInspect('gpu')} 
            className="z-10 dark:bg-slate-900 bg-white hover:border-indigo-400 transition p-2.5 rounded-xl border dark:border-slate-800 border-slate-300 tactile-chip flex flex-wrap items-center justify-between gap-2 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    {gpu.isDiscrete ? 'DISCRETE GRAPHICS ENGINE' : 'INTEGRATED GRAPHICS ENGINE'}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded dark:bg-slate-800 bg-slate-100 text-slate-400 font-bold">
                    {gpu.pcieLink}
                  </span>
                </div>
                <h4 className="text-xs font-bold dark:text-white text-slate-900 group-hover:text-indigo-500 truncate">{gpu.name}</h4>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {gpu.vram} • {gpu.busWidth} • {gpu.tempC} °C
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 dark:bg-indigo-950 dark:text-indigo-300 bg-indigo-100 text-indigo-800 rounded text-[10px] font-mono font-bold">
              Inspect {gpu.isDiscrete ? 'GPU' : 'iGPU'} ↗
            </span>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
