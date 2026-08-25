import React, { useState } from 'react';
import { Cpu, Target, SlidersHorizontal, Globe, Sparkles, Radio, Bot, Volume2, VolumeX, Palette } from 'lucide-react';
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
  onSelectTheme: (t: ThemeType) => void;
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
  onSelectTheme,
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

  const themeOptions: { id: ThemeType; label_VI: string; label_EN: string; icon: string }[] = [
    { id: 'arctic', label_VI: 'Băng Tuyết (Arctic)', label_EN: 'Arctic Cleanroom', icon: '❄️' },
    { id: 'latte', label_VI: 'Cà Phê Sữa (Latte)', label_EN: 'Warm Latte', icon: '☕' },
    { id: 'matcha', label_VI: 'Trà Xanh (Matcha Zen)', label_EN: 'Matcha Zen', icon: '🍵' },
    { id: 'sakura', label_VI: 'Hoa Anh Đào (Sakura)', label_EN: 'Sakura Blossom', icon: '🌸' },
    { id: 'slate', label_VI: 'Đêm Dịu Mắt (Slate Dark)', label_EN: 'Slate Studio', icon: '🌌' },
  ];

  return (
    <header className="studio-card rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shrink-0">
      
      {/* Left: Logo & Live Host Details */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl theme-btn-grad flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1 theme-title leading-none">
              AeroSpec <span className="theme-primary-text">Pro</span>
            </h1>
            <span className="px-1.5 py-0.2 text-[9px] font-bold theme-badge-primary rounded-full font-mono">
              v2.6
            </span>
            {isLiveDetected && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full font-mono flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" /> LIVE PC
              </span>
            )}
          </div>
          <p className="text-[10px] theme-muted font-mono flex items-center gap-1.5 mt-0.5 leading-none truncate">
            <span>Host: <strong className="theme-sub">{hostName}</strong></span>
            <span className="opacity-40">•</span>
            <span>{dict.uptime} <strong className="theme-sub">{uptime}</strong></span>
            <span className="opacity-40">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
              {dict.busStatus}
            </span>
          </p>
        </div>
      </div>

      {/* Right Controls: Simulator Mode + Persona + Theme + Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* Live Rig Simulator Selector */}
        <div className="flex items-center gap-1 theme-chip-box px-2 py-1 rounded-xl shadow-sm">
          <SlidersHorizontal className="w-3 h-3 theme-primary-text shrink-0" />
          <select 
            value={rigProfile} 
            onChange={(e) => {
              soundFx.playSwitch();
              onSelectRig(e.target.value as RigProfileType);
            }} 
            className="bg-transparent text-[10px] font-bold theme-primary-text focus:outline-none cursor-pointer max-w-[130px] 2xl:max-w-[190px] truncate"
          >
            <option value="live" className="theme-title bg-slate-900 text-white dark:bg-slate-900 font-bold">
              {lang === 'EN' ? 'LIVE PC: Host WMI' : 'LIVE PC: Máy thật'}
            </option>
            <option value="full" className="theme-title bg-slate-900 text-white dark:bg-slate-900">
              {lang === 'EN' ? 'SIM: Full 7800X3D' : 'GIẢ LẬP: Full 7800X3D'}
            </option>
            <option value="missing" className="theme-title bg-slate-900 text-white dark:bg-slate-900">
              {lang === 'EN' ? 'SIM: Missing Parts' : 'GIẢ LẬP: Khuyết linh kiện'}
            </option>
          </select>
        </div>

        {/* Persona Selector */}
        <div className="flex items-center gap-1 theme-chip-box px-2 py-1 rounded-xl shadow-sm">
          <Target className="w-3 h-3 theme-primary-text shrink-0" />
          <select 
            value={persona} 
            onChange={(e) => {
              soundFx.playSwitch();
              onSelectPersona(e.target.value as PersonaType);
            }} 
            className="bg-transparent text-[10px] font-bold theme-secondary-text focus:outline-none cursor-pointer max-w-[130px] 2xl:max-w-[170px] truncate"
          >
            <option value="dev" className="theme-title bg-slate-900 text-white dark:bg-slate-900">Dev + Docker</option>
            <option value="creator" className="theme-title bg-slate-900 text-white dark:bg-slate-900">4K Creator</option>
            <option value="esports" className="theme-title bg-slate-900 text-white dark:bg-slate-900">Esports 240Hz</option>
            <option value="silent" className="theme-title bg-slate-900 text-white dark:bg-slate-900">Silent AI Lab</option>
          </select>
        </div>

        {/* Theme Palette Switcher Dropdown */}
        <div className="flex items-center gap-1 theme-chip-box px-2 py-1 rounded-xl shadow-sm">
          <Palette className="w-3 h-3 text-amber-500 shrink-0" />
          <select
            value={theme}
            onChange={(e) => {
              soundFx.playSwitch();
              onSelectTheme(e.target.value as ThemeType);
            }}
            className="bg-transparent text-[10px] font-bold theme-title focus:outline-none cursor-pointer"
          >
            {themeOptions.map((opt) => (
              <option key={opt.id} value={opt.id} className="theme-title bg-slate-900 text-white dark:bg-slate-900">
                {opt.icon} {lang === 'VI' ? opt.label_VI : opt.label_EN}
              </option>
            ))}
          </select>
        </div>

        {/* AI Advisor Button */}
        <button
          onClick={handleAiAdvisorClick}
          className="px-2.5 py-1 rounded-xl theme-btn-grad font-bold text-[11px] flex items-center gap-1 transition duration-150 cursor-pointer"
        >
          <Bot className="w-3 h-3" />
          <span>{lang === 'EN' ? 'AI Advisor' : 'Tư Vấn Nâng Cấp'}</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-1.5 rounded-xl theme-chip-box text-xs transition cursor-pointer shadow-sm ${
            isMuted ? 'theme-muted' : 'theme-primary-text'
          }`}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Lang Toggle */}
        <button 
          onClick={() => {
            soundFx.playSwitch();
            onToggleLang();
          }} 
          className="px-2 py-1 rounded-xl theme-chip-box theme-primary-text flex items-center gap-1 text-[10px] font-extrabold transition cursor-pointer shadow-sm"
        >
          <Globe className="w-2.5 h-2.5" />
          <span>{lang}</span>
        </button>

        {/* Export Flex Card */}
        <button 
          onClick={handleExportClick}
          className="px-2.5 py-1 rounded-xl theme-btn-primary font-bold text-[11px] flex items-center gap-1 transition duration-150 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" /> <span>{dict.exportBtn}</span>
        </button>
      </div>

    </header>
  );
};
