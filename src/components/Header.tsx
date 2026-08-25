import React, { useState } from 'react';
import { Cpu, Target, SlidersHorizontal, Globe, Sun, Moon, Sparkles, Radio, Bot, Volume2, VolumeX } from 'lucide-react';
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
      particleCount: 50,
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
    <header className="studio-card rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shrink-0">
      
      {/* Left: Logo & Live Host Details */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1 dark:text-white text-slate-900 leading-none">
              AeroSpec <span className="text-sky-500">Pro</span>
            </h1>
            <span className="px-1.5 py-0.2 text-[9px] font-bold dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 bg-sky-100 text-sky-800 border border-sky-300 rounded-full font-mono">
              v2.6
            </span>
            {isLiveDetected && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold dark:bg-emerald-950 dark:text-emerald-300 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-mono flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" /> LIVE PC
              </span>
            )}
          </div>
          <p className="text-[10px] dark:text-slate-400 text-slate-600 font-mono flex items-center gap-1.5 mt-0.5 leading-none truncate">
            <span>Host: <strong className="dark:text-slate-200 text-slate-800">{hostName}</strong></span>
            <span className="text-slate-400">•</span>
            <span>{dict.uptime} <strong className="dark:text-slate-200 text-slate-800">{uptime}</strong></span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
              {dict.busStatus}
            </span>
          </p>
        </div>
      </div>

      {/* Right Controls: Simulator Mode + Persona + Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* Live Rig Simulator Selector */}
        <div className="flex items-center gap-1 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-300 px-2 py-1 rounded-xl shadow-sm">
          <SlidersHorizontal className="w-3 h-3 text-sky-500 shrink-0" />
          <select 
            value={rigProfile} 
            onChange={(e) => {
              soundFx.playSwitch();
              onSelectRig(e.target.value as RigProfileType);
            }} 
            className="bg-transparent text-[10px] font-bold text-sky-600 dark:text-sky-400 focus:outline-none cursor-pointer max-w-[140px] 2xl:max-w-[200px] truncate"
          >
            <option value="live" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white font-bold">
              {lang === 'EN' ? 'LIVE PC: Host WMI' : 'LIVE PC: Máy thật'}
            </option>
            <option value="full" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">
              {lang === 'EN' ? 'SIM: Full 7800X3D + 4070 Ti' : 'GIẢ LẬP: Full 7800X3D + 4070 Ti'}
            </option>
            <option value="missing" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">
              {lang === 'EN' ? 'SIM: Missing Parts' : 'GIẢ LẬP: Khuyết linh kiện'}
            </option>
          </select>
        </div>

        {/* Persona Selector */}
        <div className="flex items-center gap-1 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-300 px-2 py-1 rounded-xl shadow-sm">
          <Target className="w-3 h-3 text-sky-500 shrink-0" />
          <select 
            value={persona} 
            onChange={(e) => {
              soundFx.playSwitch();
              onSelectPersona(e.target.value as PersonaType);
            }} 
            className="bg-transparent text-[10px] font-bold dark:text-sky-300 text-sky-700 focus:outline-none cursor-pointer max-w-[140px] 2xl:max-w-[180px] truncate"
          >
            <option value="dev" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">Dev + Docker + 1440p</option>
            <option value="creator" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">4K Creator + Blender</option>
            <option value="esports" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">Esports 240Hz High FPS</option>
            <option value="silent" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">Silent AI Lab LLM</option>
          </select>
        </div>

        {/* AI Advisor Button */}
        <button
          onClick={handleAiAdvisorClick}
          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-[11px] flex items-center gap-1 transition duration-150 cursor-pointer shadow-md shadow-indigo-500/25"
        >
          <Bot className="w-3 h-3" />
          <span>{lang === 'EN' ? 'AI Advisor' : 'Tư Vấn Nâng Cấp'}</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-1.5 rounded-xl border text-xs transition cursor-pointer shadow-sm ${
            isMuted 
              ? 'dark:bg-slate-900 bg-slate-100 border-slate-300 dark:border-slate-800 text-slate-400' 
              : 'dark:bg-slate-800 bg-white border-slate-300 dark:border-slate-700 text-sky-500'
          }`}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>

        {/* Lang Toggle */}
        <button 
          onClick={() => {
            soundFx.playSwitch();
            onToggleLang();
          }} 
          className="px-2 py-1 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-750 bg-white hover:bg-slate-100 border dark:border-slate-700 border-slate-300 dark:text-sky-400 text-sky-600 flex items-center gap-1 text-[10px] font-extrabold transition cursor-pointer shadow-sm"
        >
          <Globe className="w-2.5 h-2.5" />
          <span>{lang}</span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={() => {
            soundFx.playSwitch();
            onToggleTheme();
          }} 
          className="px-2 py-1 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-750 bg-white hover:bg-slate-100 border dark:border-slate-700 border-slate-300 dark:text-amber-400 text-slate-800 flex items-center gap-1 text-[10px] font-bold transition cursor-pointer shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Export Flex Card */}
        <button 
          onClick={handleExportClick}
          className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-[11px] flex items-center gap-1 transition duration-150 cursor-pointer shadow-md shadow-sky-500/25"
        >
          <Sparkles className="w-3 h-3" /> <span>{dict.exportBtn}</span>
        </button>
      </div>

    </header>
  );
};
