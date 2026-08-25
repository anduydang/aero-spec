import React, { useCallback, useEffect, useRef } from 'react';
import { CircuitBoard, Cpu, Layers, HardDrive, Monitor, Shield, ArrowUpRight } from 'lucide-react';
import type { HardwareTelemetryState } from '../types/hardware';
import { motion } from 'framer-motion';

interface MotherboardSchematicProps {
  telemetry: HardwareTelemetryState;
  onInspect: (id: string) => void;
}

export const MotherboardSchematic: React.FC<MotherboardSchematicProps> = ({
  telemetry,
  onInspect,
}) => {
  const { motherboard, cpu, ram, storage, gpu } = telemetry;
  const { capabilities } = telemetry.telemetry;
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
  const dimmGridColumns = ram.slots.length <= 2 ? 'grid-cols-2' : 'grid-cols-4';

  const drawBuses = useCallback(() => {
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

    const copperBase = 'var(--trace-copper)';
    const primaryBus = 'var(--trace-primary)';
    const secondaryBus = 'var(--trace-secondary)';
    const goldVia = 'var(--trace-via)';
    const labelBg = 'var(--trace-label-bg)';
    const labelBorder = 'var(--trace-label-border)';

    let svgContent = '';

    // 1. RAM Multi-Lane Bus
    const ramOffsets = ram.isSingleChannel ? [-2, 2] : [-6, -2, 2, 6];
    ramOffsets.forEach((offset, idx) => {
      const y = cCpu.cy + offset * 3.5;
      svgContent += `
        <line x1="${cCpu.right}" y1="${y}" x2="${cRam.left}" y2="${y}" stroke="${copperBase}" stroke-width="2.5" />
        <line x1="${cCpu.right}" y1="${y}" x2="${cRam.left}" y2="${y}" stroke="${ram.isSingleChannel ? '#f59e0b' : primaryBus}" stroke-width="1.5" class="trace-bus-fast" style="animation-delay: ${idx * 0.2}s" />
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
              fill="none" stroke="${primaryBus}" stroke-width="1.5" class="trace-bus" />
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
                  fill="none" stroke="${primaryBus}" stroke-width="1.5" class="trace-bus" />
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
        <line x1="${x}" y1="${startY}" x2="${x}" y2="${cGpu.top}" stroke="${isDiscrete ? secondaryBus : primaryBus}" stroke-width="1.5" class="trace-bus-fast" style="animation-delay: ${idx * 0.15}s" />
        <circle cx="${x}" cy="${cGpu.top - 2}" r="2" fill="${goldVia}" opacity="1" />
      `;
    });

    const gpuLabel = gpu.isDiscrete ? 'PCIe 4.0 x16 [DIRECT CPU LINK]' : 'SYSTEM BUS [RING / iGPU ACTIVE]';
    const gpuLabelY = (cNvme1.bottom + cGpu.top) / 2;

    svgContent += `
      <g>
        <rect x="${cCpu.cx - 85}" y="${gpuLabelY - 7}" width="170" height="14" rx="4" fill="${labelBg}" stroke="${labelBorder}" stroke-width="1" />
        <text x="${cCpu.cx}" y="${gpuLabelY + 3.5}" fill="${gpu.isDiscrete ? secondaryBus : primaryBus}" font-family="Cascadia Code, JetBrains Mono, monospace" font-size="8" font-weight="bold" text-anchor="middle">${gpuLabel}</text>
      </g>
    `;

    svg.innerHTML = svgContent;
  }, [gpu.isDiscrete, ram.isSingleChannel, storage.m2_2.isPopulated]);

  useEffect(() => {
    drawBuses();
    const ro = new ResizeObserver(() => drawBuses());
    if (areaRef.current) ro.observe(areaRef.current);
    window.addEventListener('resize', drawBuses);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', drawBuses);
    };
  }, [drawBuses]);

  const hasSchematicData = capabilities.motherboardIdentity
    || capabilities.cpuIdentity
    || capabilities.ramIdentity
    || capabilities.gpuIdentity
    || capabilities.storageIdentity;

  if (!hasSchematicData) {
    return (
      <section className="order-1 xl:order-2">
        <div className="studio-card rounded-2xl p-6 min-h-[360px] flex flex-col items-center justify-center text-center gap-3">
          <CircuitBoard className="w-8 h-8 theme-primary-text" />
          <div>
            <h2 className="text-base font-black theme-title">Live schematic unavailable in browser preview</h2>
            <p className="text-xs theme-muted mt-1 max-w-md leading-relaxed">
              Open the Tauri desktop build for WMI detection, or choose a simulator profile to explore the board map.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="order-1 xl:order-2 flex flex-col gap-3">
      <div className="studio-card rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 flex-1 relative overflow-hidden">
        
        {/* Board Header with BIOS Details */}
        <div 
          onClick={() => onInspect('mainboard')} 
          className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 dark:border-slate-800 pb-2 cursor-pointer group z-10"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl theme-badge-primary flex items-center justify-center shadow-sm transition">
              <CircuitBoard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold theme-title group-hover:theme-primary-text transition leading-none">{motherboard.name}</h2>
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded shadow-sm">
                  BIOS: {motherboard.biosVersion}
                </span>
              </div>
              <p className="text-[10px] theme-muted font-mono mt-0.5 leading-none">
                {motherboard.chipset} • {motherboard.pcbLayers} • Date: {motherboard.biosDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 theme-badge-primary rounded text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
              <span>Inspect Board & BIOS</span> <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Realistic PCB Substrate Canvas */}
        <div 
          ref={areaRef}
          className="pcb-substrate rounded-2xl p-3 border border-black/5 dark:border-slate-800 flex-1 flex flex-col justify-between min-h-[360px] gap-2.5 relative shadow-inner"
        >
          <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-0"></svg>

          {/* TOP ROW: VRM Heatsink & CPU Socket & DIMM Banks */}
          <div className="grid grid-cols-12 gap-2.5 z-10">
            
            {/* VRM Module */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => onInspect('vrm')} 
              className="col-span-4 theme-chip-box hover:border-amber-400 transition p-2.5 rounded-xl tactile-chip flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> VRM
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{motherboard.vrm.tempC} °C</span>
                </div>
                <div className="text-[11px] font-bold theme-title mt-0.5 font-mono">{motherboard.vrm.phases}</div>
              </div>

              <div className="w-full bg-black/10 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-emerald-500 h-full" style={{ width: `${motherboard.vrm.mosfetLoadPct}%` }}></div>
              </div>
            </motion.div>

            {/* Socket Central Core */}
            <motion.div 
              ref={nodeCpuRef}
              whileHover={{ scale: 1.01 }}
              onClick={() => onInspect('cpu')} 
              className="col-span-4 theme-socket-box transition p-2.5 rounded-xl tactile-chip flex flex-col items-center justify-center text-center relative group cursor-pointer"
            >
              <div className="absolute -top-2 px-1.5 py-0.2 theme-btn-primary rounded text-[8px] font-mono font-extrabold shadow-md">
                {socketLabel}
              </div>
              <Cpu className="w-6 h-6 theme-primary-text mb-0.5" />
              <span className="text-[11px] font-extrabold theme-title">{archFamily}</span>
              <span className="text-[10px] theme-primary-text font-mono font-bold truncate w-full">{cpu.name}</span>
            </motion.div>

            {/* DIMM Slot Bank */}
            <motion.div 
              ref={nodeRamRef}
              whileHover={{ scale: 1.01 }}
              onClick={() => onInspect('ram')} 
              className="col-span-4 theme-chip-box hover:border-indigo-400 transition p-2 rounded-xl tactile-chip flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider theme-secondary-text flex items-center gap-1">
                  <Layers className="w-3 h-3" /> DIMM SLOTS
                </span>
                <span className={`text-[9px] font-mono font-extrabold px-1 py-0.2 rounded ${
                  ram.isSingleChannel ? 'bg-amber-500/20 text-amber-600' : 'theme-badge-secondary'
                }`}>
                  {busTypeLabel}
                </span>
              </div>

              {/* Slots */}
              <div data-testid="dimm-slot-grid" className={`grid ${dimmGridColumns} gap-1 my-1`}>
                {ram.slots.map((s, idx) => (
                  <div 
                    key={idx}
                    className={`h-10 min-w-0 overflow-hidden rounded border flex flex-col items-center justify-between p-0.5 text-[9px] font-mono font-bold ${
                      s.status === 'active' 
                        ? 'theme-btn-grad border-transparent shadow text-white' 
                        : 'bg-black/5 dark:bg-slate-950 border-dashed border-black/15 dark:border-slate-800 theme-muted'
                    }`}
                  >
                    <span className="block w-full truncate text-center" title={s.slot}>{s.slot}</span>
                    <span className="block w-full truncate text-center text-[8px]" title={s.status === 'active' ? s.size : 'Empty'}>
                      {s.status === 'active' ? s.size : '[EMPTY]'}
                    </span>
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
              className="col-span-4 theme-chip-box transition p-2.5 rounded-xl tactile-chip cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider theme-muted flex items-center gap-1">
                  <HardDrive className="w-3 h-3 theme-primary-text" /> DISK #1
                </span>
                <span className="text-[8px] font-mono font-bold px-1 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded">
                  ACTIVE
                </span>
              </div>
              <h4 className="text-[11px] font-bold theme-title group-hover:theme-primary-text truncate mt-1">{storage.m2_1.name}</h4>
              <div className="flex justify-between items-center text-[9px] font-mono theme-muted mt-1">
                <span className="theme-primary-text font-bold">{storage.m2_1.speedRead}</span>
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
                  ? 'theme-chip-box' 
                  : 'bg-black/5 dark:bg-slate-950/40 border-dashed border-black/15 dark:border-slate-800 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider theme-muted flex items-center gap-1">
                  <HardDrive className="w-3 h-3 theme-secondary-text" /> DISK #2
                </span>
                <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded ${
                  storage.m2_2.isPopulated ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-black/10 dark:bg-slate-700 theme-muted'
                }`}>
                  {storage.m2_2.isPopulated ? 'ACTIVE' : 'EMPTY'}
                </span>
              </div>
              <h4 className="text-[11px] font-bold theme-title group-hover:theme-secondary-text truncate mt-1">
                {storage.m2_2.isPopulated ? storage.m2_2.name : 'Secondary Storage Bay'}
              </h4>
              <div className="flex justify-between items-center text-[9px] font-mono theme-muted mt-1">
                <span className="theme-secondary-text font-bold">{storage.m2_2.speedRead}</span>
                <span>{storage.m2_2.isPopulated ? `${storage.m2_2.tempC} °C` : '--'}</span>
              </div>
            </motion.div>

            {/* Storage Bay #3 */}
            <div className="col-span-4 bg-black/5 dark:bg-slate-950/40 border-dashed border-black/15 dark:border-slate-800 rounded-xl border p-2.5 flex flex-col justify-center items-center text-center opacity-60">
              <span className="text-[10px] font-bold theme-muted">Storage Bay #3</span>
              <span className="text-[8px] theme-muted font-mono">[Available for Upgrade]</span>
            </div>

          </div>

          {/* BOTTOM ROW: Graphics Engine Card (PCIe / iGPU) */}
          <motion.div 
            ref={nodeGpuRef}
            whileHover={{ scale: 1.005 }}
            onClick={() => onInspect('gpu')} 
            className="z-10 theme-chip-box transition p-2.5 rounded-xl tactile-chip flex flex-wrap items-center justify-between gap-2 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg theme-badge-secondary flex items-center justify-center shrink-0">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider theme-secondary-text">
                    {gpu.isDiscrete ? 'DISCRETE GRAPHICS ENGINE' : 'INTEGRATED GRAPHICS ENGINE'}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded theme-chip-box theme-muted font-bold">
                    {gpu.pcieLink}
                  </span>
                </div>
                <h4 className="text-xs font-bold theme-title group-hover:theme-secondary-text truncate">{gpu.name}</h4>
                <p className="text-[10px] font-mono theme-muted mt-0.5">
                  {gpu.vram} • {gpu.busWidth} • {gpu.tempC} °C
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 theme-badge-secondary rounded text-[10px] font-mono font-bold">
              Inspect {gpu.isDiscrete ? 'GPU' : 'iGPU'} ↗
            </span>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
