import React, { useState } from 'react';
import { Cpu, Target, SlidersHorizontal, Globe, Sun, Moon, Sparkles, MousePointerClick, Radio, Bot, Volume2, VolumeX } from 'lucide-react';
import type { LanguageType, PersonaType, RigProfileType, ThemeType } from '../types/hardware';
import { i18nData } from '../data/i18nData';
import { soundFx } from '../utils/soundFx';
import confetti from 'canvas-confetti';

interface HeaderProps {
  hostName: string;
  uptime: string;
  isLiveDetected?: boolean;
  lang: LanguageType;
  theme: ThemeType;
  persona: PersonaType;
  rigProfile: RigProfileType;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onSelectPersona: (p: PersonaType) => void;
  onSelectRig: (r: RigProfileType) => void;
  onOpenFlexCard: () => void;
  onOpenAiAdvisor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hostName,
  uptime,
  isLiveDetected,
  lang,
  theme,
  persona,
  rigProfile,
  onToggleLang,
  onToggleTheme,
  onSelectPersona,
  onSelectRig,
  onOpenFlexCard,
  onOpenAiAdvisor,
}) => {
  const dict = i18nData[lang];
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.isMuted());

  const handleExportClick = () => {
    soundFx.playChime();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.15 },
      colors: ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b']
    });
    onOpenFlexCard();
  };

  const handleAiAdvisorClick = () => {
    soundFx.playClick();
    onOpenAiAdvisor();
  };

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    soundFx.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (!nextMuted) soundFx.playClick();
  };

  return (
    <header className="studio-card rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3.5">
      
      {/* Logo & Live Host Info */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-1 dark:text-white text-slate-900">
              AeroSpec <span className="text-sky-500">Pro</span>
            </h1>
            <span className="px-2 py-0.2 text-[11px] font-semibold dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 bg-sky-100 text-sky-800 border border-sky-300 rounded-full font-mono shadow-sm">
              v2.6
            </span>
            {isLiveDetected && (
              <span className="px-2 py-0.2 text-[11px] font-bold dark:bg-emerald-950 dark:text-emerald-300 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-mono flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> LIVE PC
              </span>
            )}
            <span className="text-xs dark:text-slate-300 text-slate-700 dark:bg-slate-800 bg-white px-2.5 py-0.5 rounded-lg border dark:border-slate-700 border-slate-300 hidden md:flex items-center gap-1 font-semibold shadow-sm">
              <MousePointerClick className="w-3.5 h-3.5 text-sky-500" /> {dict.headerHint}
            </span>
          </div>
          <p className="text-xs dark:text-slate-300 text-slate-600 font-mono flex items-center gap-2 mt-0.5">
            <span>Host: <strong className="dark:text-white text-slate-900">{hostName}</strong></span>
            <span className="text-slate-400">•</span>
            <span>{dict.uptime} <strong className="dark:text-slate-200 text-slate-800">{uptime}</strong></span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
              {dict.busStatus}
            </span>
          </p>
        </div>
      </div>

      {/* Center: Hardware Simulation Mode + Persona Selector */}
      <div className="flex flex-wrap items-center gap-2.5">
        
        {/* Live Rig Simulator Switcher */}
        <div className="flex items-center gap-1.5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-300 px-3 py-1.5 rounded-xl shadow-sm">
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" />
          <span className="text-xs font-bold dark:text-slate-300 text-slate-700 hidden lg:inline">{dict.rigMode}</span>
          <select 
            value={rigProfile} 
            onChange={(e) => {
              soundFx.playSwitch();
              onSelectRig(e.target.value as RigProfileType);
            }} 
            className="bg-transparent text-xs font-bold text-sky-600 dark:text-sky-400 focus:outline-none cursor-pointer"
          >
            <option value="live" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white font-bold">
              {lang === 'EN' ? 'LIVE PC: Host WMI Telemetry' : 'LIVE PC: Phần cứng máy thật (WMI)'}
            </option>
            <option value="full" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">
              {lang === 'EN' ? 'SIMULATOR: Fully Loaded Rig (7800X3D + 4070 Ti)' : 'GIẢ LẬP: Cấu hình đầy đủ (7800X3D + 4070 Ti)'}
            </option>
            <option value="missing" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">
              {lang === 'EN' ? 'SIMULATOR: Missing Parts (Single RAM / No dGPU)' : 'GIẢ LẬP: Khuyết linh kiện (1 RAM / Không GPU rời)'}
            </option>
          </select>
        </div>

        {/* User Persona Selector */}
        <div className="flex items-center gap-1.5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-300 px-3 py-1.5 rounded-xl shadow-sm">
          <Target className="w-3.5 h-3.5 text-sky-500" />
          <select 
            value={persona} 
            onChange={(e) => {
              soundFx.playSwitch();
              onSelectPersona(e.target.value as PersonaType);
            }} 
            className="bg-transparent text-xs font-bold dark:text-sky-300 text-sky-700 focus:outline-none cursor-pointer"
          >
            <option value="dev" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">Fullstack Dev + Docker + 1440p Gaming</option>
            <option value="creator" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">4K Video Creator + Unreal 5 + Blender</option>
            <option value="esports" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">Esports Low-Latency 240Hz High FPS</option>
            <option value="silent" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">Silent AI Lab (Local LLM Q4/Q8)</option>
          </select>
        </div>

      </div>

      {/* Right Controls: AI Advisor + Sound + Language + Theme + Export */}
      <div className="flex items-center gap-2">
        
        {/* AI Upgrade Advisor Action */}
        <button
          onClick={handleAiAdvisorClick}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-md shadow-indigo-500/25"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{lang === 'EN' ? 'AI Advisor' : 'Tư Vấn Nâng Cấp'}</span>
        </button>

        {/* Audio FX Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-2 rounded-xl border text-xs transition cursor-pointer shadow-sm ${
            isMuted 
              ? 'dark:bg-slate-900 bg-slate-100 border-slate-300 dark:border-slate-800 text-slate-400' 
              : 'dark:bg-slate-800 bg-white border-slate-300 dark:border-slate-700 text-sky-500'
          }`}
          title={isMuted ? 'Bật âm thanh vi mạch' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        <button 
          onClick={() => {
            soundFx.playSwitch();
            onToggleLang();
          }} 
          className="px-3 py-1.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-750 bg-white hover:bg-slate-100 border dark:border-slate-700 border-slate-300 dark:text-sky-400 text-sky-600 flex items-center gap-1.5 text-xs font-extrabold transition cursor-pointer shadow-sm"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang}</span>
        </button>

        <button 
          onClick={() => {
            soundFx.playSwitch();
            onToggleTheme();
          }} 
          className="px-3 py-1.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-750 bg-white hover:bg-slate-100 border dark:border-slate-700 border-slate-300 dark:text-amber-400 text-slate-800 flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <button 
          onClick={handleExportClick}
          className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-md shadow-sky-500/25"
        >
          <Sparkles className="w-3.5 h-3.5" /> <span>{dict.exportBtn}</span>
        </button>
      </div>

    </header>
  );
};
