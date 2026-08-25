import React, { useRef, useState } from 'react';
import { X, Download, Copy, Check, Sparkles, Cpu, HardDrive, Layers, CircuitBoard, Monitor, ShieldCheck } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import type { HardwareScore, HardwareTelemetryState, LanguageType, PersonaType } from '../types/hardware';
import { i18nData } from '../data/i18nData';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface FlexCardModalProps {
  isOpen: boolean;
  telemetry: HardwareTelemetryState;
  lang: LanguageType;
  persona: PersonaType;
  score: HardwareScore;
  onClose: () => void;
}

export const FlexCardModal: React.FC<FlexCardModalProps> = ({
  isOpen,
  telemetry,
  lang,
  persona,
  score,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const dialogRef = useAccessibleDialog<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const dict = i18nData[lang];
  const rigKey = telemetry.telemetry.mode === 'live' ? 'live' : (telemetry.ram.isSingleChannel ? 'missing' : 'full');
  const insight = dict.personas[rigKey][persona];

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `AeroSpec_FlexCard_${telemetry.hostName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Không thể tạo file ảnh tải về.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Trình duyệt chưa cấp quyền sao chép ảnh vào clipboard.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop Blur Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 overlay-backdrop cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div 
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="flex-card-title"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="overlay-panel relative z-10 w-full max-w-3xl border overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="overlay-section overlay-divider p-4 sm:p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 id="flex-card-title" className="text-base font-extrabold theme-title">
                  {lang === 'EN' ? 'AeroSpec Holographic Flex Card' : 'Thẻ Flex Phần Cứng AeroSpec Pro'}
                </h3>
                <p className="text-xs theme-muted font-mono">
                  {lang === 'EN' ? 'Preview & Export High-Resolution Rig Summary' : 'Xem trước & xuất ảnh thông số cấu hình độ phân giải cao'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              aria-label={lang === 'EN' ? 'Close Flex Card' : 'Đóng thẻ Flex'}
              className="overlay-icon-button w-8 h-8 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body: The Rendered Flex Card Target */}
          <div className="overlay-canvas p-4 sm:p-6 overflow-y-auto flex items-center justify-center">
            
            {/* THIS IS THE CARD CONTAINER RASTERIZED TO PNG */}
            <div 
              ref={cardRef}
              data-testid="export-flex-card"
              className="w-full max-w-[620px] rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0b1329] to-slate-950 border-2 border-sky-500/40 shadow-2xl flex flex-col gap-5 text-white select-none"
              style={{
                backgroundColor: '#0b1329',
                backgroundImage: 'radial-gradient(ellipse at top right, rgba(14, 165, 233, 0.15), transparent 60%), radial-gradient(ellipse at bottom left, rgba(99, 102, 241, 0.12), transparent 60%)'
              }}
            >
              {/* Card Holographic Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight text-white">
                        AeroSpec <span className="text-sky-400">PRO</span>
                      </span>
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.2 bg-sky-950 text-sky-300 border border-sky-700/50 rounded-full">
                        {telemetry.isLiveDetected ? 'LIVE MACHINE' : 'SIMULATOR'}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      HOST: <strong className="text-slate-200">{telemetry.hostName}</strong> • {telemetry.telemetry.mode === 'simulated' ? 'SIMULATED PROFILE' : 'LIVE SNAPSHOT'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Synergy Rating</span>
                  <div className="flex items-baseline gap-1">
                    <span data-testid="flex-score" className="text-2xl font-black text-emerald-400">{score.score ?? '—'}</span>
                    <span className="text-xs text-slate-500 font-mono">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Hardware Spec Grid */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* CPU Box */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold mb-1">
                    <Cpu className="w-3.5 h-3.5" /> <span>PROCESSOR</span>
                  </div>
                  <h4 className="text-xs font-black text-white truncate">{telemetry.cpu.name}</h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                    <span>{telemetry.cpu.cores}C / {telemetry.cpu.threads}T</span>
                    <span className="text-sky-300">{telemetry.cpu.avgClockMhz} MHz</span>
                  </div>
                </div>

                {/* GPU Box */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold mb-1">
                    <Monitor className="w-3.5 h-3.5" /> <span>GRAPHICS</span>
                  </div>
                  <h4 className="text-xs font-black text-white truncate">{telemetry.gpu.name}</h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                    <span>{telemetry.gpu.vram}</span>
                    <span className="text-indigo-300">{telemetry.gpu.tempC}°C</span>
                  </div>
                </div>

                {/* RAM Box */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                    <Layers className="w-3.5 h-3.5" /> <span>MEMORY</span>
                  </div>
                  <h4 className="text-xs font-black text-white truncate">{telemetry.ram.totalGb}GB {telemetry.ram.channelMode}</h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                    <span>{telemetry.ram.config}</span>
                    <span className="text-amber-300">{telemetry.ram.primaryTimings}</span>
                  </div>
                </div>

                {/* Motherboard & BIOS Box */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mb-1">
                    <CircuitBoard className="w-3.5 h-3.5" /> <span>MAINBOARD & BIOS</span>
                  </div>
                  <h4 className="text-xs font-black text-white truncate">{telemetry.motherboard.name}</h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between truncate">
                    <span className="text-emerald-300 font-bold truncate">BIOS: {telemetry.motherboard.biosVersion}</span>
                    <span className="text-slate-500 shrink-0 ml-1">{telemetry.motherboard.biosDate}</span>
                  </div>
                </div>

              </div>

              {/* Storage & Power Quick Strip */}
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-1.5 truncate">
                  <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{telemetry.storage.m2_1.name}</span>
                </div>
                <span className="text-sky-400 font-bold shrink-0 ml-2">{telemetry.storage.m2_1.speedRead}</span>
              </div>

              {/* Local compatibility highlight */}
              <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-sky-950/60 p-3 rounded-xl border border-indigo-500/30 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-300">
                  <strong className="text-white font-bold">{insight.tag1}:</strong> {insight.text1}
                </div>
              </div>

              {/* Card Footer Signature */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                <span>VERIFIED SILICON TELEMETRY</span>
                <span>AEROSPEC STUDIO V2.6.0</span>
              </div>

            </div>

          </div>

          {/* Modal Action Footer */}
          <div className="overlay-section overlay-divider p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {copySuccess && (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Copied image to clipboard!' : 'Đã sao chép ảnh vào clipboard!'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button 
                onClick={handleCopyClipboard}
                disabled={isExporting}
                className="overlay-control px-4 py-2 text-xs font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>{lang === 'EN' ? 'Copy Image' : 'Sao chép ảnh'}</span>
              </button>

              <button 
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/25 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? (lang === 'EN' ? 'Rendering...' : 'Đang xuất...') : (lang === 'EN' ? 'Download PNG' : 'Tải ảnh PNG (HD)')}</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
