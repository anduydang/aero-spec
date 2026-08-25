import React, { useEffect, useRef, useState } from 'react'
import {
  Bot,
  Cpu,
  Globe,
  Palette,
  Radio,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react'
import confetti from 'canvas-confetti'

import type {
  LanguageType,
  PersonaType,
  RigProfileType,
  TelemetryMetadata,
  ThemeType,
} from '../types/hardware'
import { i18nData } from '../data/i18nData'
import { soundFx } from '../utils/soundFx'

interface HeaderProps {
  hostName: string
  uptime: string
  telemetryStatus: TelemetryMetadata
  lang: LanguageType
  theme: ThemeType
  persona: PersonaType
  rigProfile: RigProfileType
  onToggleLang: () => void
  onSelectTheme: (theme: ThemeType) => void
  onSelectPersona: (persona: PersonaType) => void
  onSelectRig: (rig: RigProfileType) => void
  onOpenFlexCard: () => void
  onOpenAiAdvisor: () => void
}

const themeOptions: { id: ThemeType; labelVI: string; labelEN: string; icon: string }[] = [
  { id: 'arctic', labelVI: 'Băng tuyết', labelEN: 'Arctic Cleanroom', icon: '❄️' },
  { id: 'latte', labelVI: 'Cà phê sữa', labelEN: 'Warm Latte', icon: '☕' },
  { id: 'matcha', labelVI: 'Trà xanh', labelEN: 'Matcha Zen', icon: '🍵' },
  { id: 'sakura', labelVI: 'Hoa anh đào', labelEN: 'Sakura Blossom', icon: '🌸' },
  { id: 'slate', labelVI: 'Đêm dịu mắt', labelEN: 'Slate Studio', icon: '🌌' },
]

function getStatusCopy(metadata: TelemetryMetadata, lang: LanguageType) {
  if (metadata.mode === 'simulated') {
    return { label: lang === 'EN' ? 'Simulation' : 'Giả lập', tone: 'amber' }
  }
  if (metadata.status === 'ready') {
    return { label: lang === 'EN' ? 'Live detected' : 'Đã nhận máy thật', tone: 'emerald' }
  }
  if (metadata.status === 'scanning') {
    return { label: lang === 'EN' ? 'Scanning hardware' : 'Đang quét phần cứng', tone: 'sky' }
  }
  if (metadata.status === 'error') {
    return { label: lang === 'EN' ? 'Live scan error' : 'Lỗi quét máy thật', tone: 'rose' }
  }
  return { label: lang === 'EN' ? 'Live preview unavailable' : 'Live không có trong trình duyệt', tone: 'slate' }
}

export const Header: React.FC<HeaderProps> = ({
  hostName,
  uptime,
  telemetryStatus,
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
  const dict = i18nData[lang]
  const [isMuted, setIsMuted] = useState(() => soundFx.isMuted())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const status = getStatusCopy(telemetryStatus, lang)
  const statusClasses = {
    amber: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    sky: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
    rose: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    slate: 'bg-slate-500/15 theme-muted border-slate-500/30',
  }[status.tone]

  useEffect(() => {
    if (!isSettingsOpen) return
    const closeSettings = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event instanceof MouseEvent && settingsRef.current?.contains(event.target as Node)) return
      setIsSettingsOpen(false)
    }
    document.addEventListener('mousedown', closeSettings)
    document.addEventListener('keydown', closeSettings)
    return () => {
      document.removeEventListener('mousedown', closeSettings)
      document.removeEventListener('keydown', closeSettings)
    }
  }, [isSettingsOpen])

  const handleExportClick = () => {
    soundFx.playChime()
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.15 },
      colors: ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b'],
    })
    onOpenFlexCard()
  }

  const handleToggleSound = () => {
    const nextMuted = !isMuted
    soundFx.setMuted(nextMuted)
    setIsMuted(nextMuted)
    if (!nextMuted) soundFx.playClick()
  }

  return (
    <header className="studio-card relative z-40 rounded-2xl px-3.5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl theme-btn-grad flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="text-base font-black tracking-tight flex items-center gap-1 theme-title leading-none">
              AeroSpec <span className="theme-primary-text">Pro</span>
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-bold theme-badge-primary rounded-full font-mono">v2.6.0</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full font-mono flex items-center gap-1 ${statusClasses}`}>
              <Radio className={`w-3 h-3 ${telemetryStatus.status === 'scanning' ? 'animate-pulse' : ''}`} />
              {status.label}
            </span>
          </div>
          <p className="text-xs theme-muted font-mono flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 leading-tight">
            <span>Host: <strong className="theme-sub">{hostName}</strong></span>
            <span className="opacity-40">•</span>
            <span>{dict.uptime} <strong className="theme-sub">{uptime}</strong></span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
        <label className="flex items-center gap-1.5 theme-chip-box px-2.5 py-1.5 rounded-xl shadow-sm">
          <SlidersHorizontal className="w-3.5 h-3.5 theme-primary-text shrink-0" />
          <span className="sr-only">Hardware profile</span>
          <select
            aria-label="Hardware profile"
            value={rigProfile}
            onChange={(event) => {
              soundFx.playSwitch()
              onSelectRig(event.target.value as RigProfileType)
            }}
            className="bg-transparent text-xs font-bold theme-primary-text focus:outline-none cursor-pointer max-w-[155px] truncate"
          >
            <option value="live" className="bg-slate-900 text-white">{lang === 'EN' ? 'Live PC · WMI' : 'Máy thật · WMI'}</option>
            <option value="full" className="bg-slate-900 text-white">{lang === 'EN' ? 'Sim · Full rig' : 'Giả lập · Full rig'}</option>
            <option value="missing" className="bg-slate-900 text-white">{lang === 'EN' ? 'Sim · Upgrade path' : 'Giả lập · Cần nâng cấp'}</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 theme-chip-box px-2.5 py-1.5 rounded-xl shadow-sm">
          <Target className="w-3.5 h-3.5 theme-secondary-text shrink-0" />
          <span className="sr-only">Workload persona</span>
          <select
            aria-label="Workload persona"
            value={persona}
            onChange={(event) => {
              soundFx.playSwitch()
              onSelectPersona(event.target.value as PersonaType)
            }}
            className="bg-transparent text-xs font-bold theme-secondary-text focus:outline-none cursor-pointer max-w-[150px] truncate"
          >
            <option value="dev" className="bg-slate-900 text-white">Dev + Docker</option>
            <option value="creator" className="bg-slate-900 text-white">4K Creator</option>
            <option value="esports" className="bg-slate-900 text-white">Esports 240Hz</option>
            <option value="silent" className="bg-slate-900 text-white">Silent AI Lab</option>
          </select>
        </label>

        <button
          onClick={() => {
            soundFx.playClick()
            onOpenAiAdvisor()
          }}
          className="px-3 py-1.5 rounded-xl theme-btn-grad font-bold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{lang === 'EN' ? 'AI Advisor' : 'Tư vấn AI'}</span>
        </button>

        <button
          onClick={handleExportClick}
          className="px-3 py-1.5 rounded-xl theme-btn-primary font-bold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dict.exportBtn}</span>
        </button>

        <div ref={settingsRef} className="relative">
          <button
            type="button"
            aria-label={lang === 'EN' ? 'Settings' : 'Cài đặt'}
            aria-expanded={isSettingsOpen}
            aria-controls="app-settings-popover"
            onClick={() => setIsSettingsOpen((open) => !open)}
            className="p-2 rounded-xl theme-chip-box theme-primary-text shadow-sm cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isSettingsOpen && (
            <div
              id="app-settings-popover"
              role="group"
              aria-label="Display and app settings"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 studio-card rounded-2xl p-3 flex flex-col gap-3 shadow-2xl"
            >
              <label className="flex flex-col gap-1 text-xs font-bold theme-title">
                <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-amber-500" /> Theme</span>
                <select
                  aria-label="Theme"
                  value={theme}
                  onChange={(event) => {
                    soundFx.playSwitch()
                    onSelectTheme(event.target.value as ThemeType)
                  }}
                  className="theme-chip-box rounded-xl px-2.5 py-2 text-xs theme-title cursor-pointer"
                >
                  {themeOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-slate-900 text-white">
                      {option.icon} {lang === 'VI' ? option.labelVI : option.labelEN}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-label={lang === 'EN' ? 'Language: English' : 'Language: Vietnamese'}
                  onClick={() => {
                    soundFx.playSwitch()
                    onToggleLang()
                  }}
                  className="theme-chip-box rounded-xl px-2.5 py-2 text-xs font-bold theme-title flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" /> {lang}
                </button>
                <button
                  type="button"
                  aria-label={isMuted ? 'Sound: muted' : 'Sound: on'}
                  onClick={handleToggleSound}
                  className="theme-chip-box rounded-xl px-2.5 py-2 text-xs font-bold theme-title flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {isMuted ? 'Muted' : 'Sound'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
