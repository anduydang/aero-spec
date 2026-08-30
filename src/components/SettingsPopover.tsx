import { useLayoutEffect, useState, type FormEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Globe, Palette, Volume2, VolumeX } from 'lucide-react'

import type { LanguageType, ThemeType } from '../types/hardware'
import { useAccessibleDialog } from '../hooks/useAccessibleDialog'
import { usePsuProfile } from '../hooks/usePsuProfile'
import { ThemePicker } from './ThemePicker'

interface SettingsPopoverProps {
  isOpen: boolean
  triggerRef: RefObject<HTMLElement | null>
  lang: LanguageType
  theme: ThemeType
  isMuted: boolean
  onClose: () => void
  onToggleLang: () => void
  onSelectTheme: (theme: ThemeType) => void
  onToggleSound: () => void
  onRefreshHardware?: () => void
}

export function SettingsPopover({
  isOpen,
  triggerRef,
  lang,
  theme,
  isMuted,
  onClose,
  onToggleLang,
  onSelectTheme,
  onToggleSound,
  onRefreshHardware,
}: SettingsPopoverProps) {
  const dialogRef = useAccessibleDialog<HTMLDivElement>({ isOpen, onClose })
  const { profile, save, clear } = usePsuProfile()
  const [position, setPosition] = useState({ right: 12, top: 56 })

  const handlePsuSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    save({
      brandModel: String(fields.get('brandModel') ?? ''),
      ratedWattage: Number(fields.get('ratedWattage') ?? 0),
      efficiency: String(fields.get('efficiency') ?? ''),
      note: String(fields.get('note') ?? ''),
    })
  }

  useLayoutEffect(() => {
    if (!isOpen) return
    const triggerBox = triggerRef.current?.getBoundingClientRect()
    const preferredTop = (triggerBox?.bottom ?? 48) + 8
    const panelHeight = document.getElementById('app-settings-popover')?.getBoundingClientRect().height ?? 0
    const maxTop = Math.max(12, window.innerHeight - panelHeight - 12)
    setPosition({
      right: Math.max(12, window.innerWidth - (triggerBox?.right ?? window.innerWidth - 12)),
      top: Math.max(12, Math.min(preferredTop, maxTop)),
    })
  }, [isOpen, triggerRef])

  if (!isOpen) return null

  return createPortal(
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close settings"
        data-testid="settings-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-[190] cursor-default bg-transparent"
      />
      <div
        ref={dialogRef}
        id="app-settings-popover"
        role="dialog"
        aria-modal="true"
        aria-label="Display and app settings"
        className="fixed z-[200] w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-1.5rem)] overflow-y-auto studio-card rounded-2xl p-3 flex flex-col gap-3 shadow-2xl"
        style={{ ...position, position: 'fixed' }}
      >
        <div className="flex flex-col gap-2 text-xs font-bold theme-title">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-500" /> Theme
          </span>
          <ThemePicker theme={theme} lang={lang} onSelectTheme={onSelectTheme} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-label={lang === 'EN' ? 'Language: English' : 'Language: Vietnamese'}
            onClick={onToggleLang}
            className="theme-chip-box rounded-xl px-2.5 py-2 text-xs font-bold theme-title flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" /> {lang}
          </button>
          <button
            type="button"
            aria-label={isMuted ? 'Sound: muted' : 'Sound: on'}
            onClick={onToggleSound}
            className="theme-chip-box rounded-xl px-2.5 py-2 text-xs font-bold theme-title flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isMuted ? 'Muted' : 'Sound'}
          </button>
        </div>

        {onRefreshHardware && (
          <button type="button" onClick={onRefreshHardware} className="theme-chip-box rounded-xl px-2.5 py-2 text-xs font-bold theme-title">
            Refresh hardware
          </button>
        )}

        <form onSubmit={handlePsuSubmit} className="border-t border-black/10 dark:border-white/10 pt-3 flex flex-col gap-2">
          <div>
            <p className="text-xs font-extrabold theme-title">Manual PSU profile</p>
            <p className="text-[11px] theme-muted">Windows cannot identify a conventional PSU. These labels are stored only on this PC.</p>
          </div>
          <label className="text-[11px] font-bold theme-muted">
            Power supply model
            <input
              name="brandModel"
              defaultValue={profile?.brandModel ?? ''}
              maxLength={160}
              className="mt-1 w-full theme-chip-box px-2.5 py-2 text-xs"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-bold theme-muted">
              Rated wattage
              <input
                name="ratedWattage"
                type="number"
                min="1"
                max="10000"
                defaultValue={profile?.ratedWattage || ''}
                className="mt-1 w-full theme-chip-box px-2.5 py-2 text-xs"
              />
            </label>
            <label className="text-[11px] font-bold theme-muted">
              Efficiency
              <input
                name="efficiency"
                defaultValue={profile?.efficiency ?? ''}
                maxLength={160}
                className="mt-1 w-full theme-chip-box px-2.5 py-2 text-xs"
              />
            </label>
          </div>
          <label className="text-[11px] font-bold theme-muted">
            Note
            <input name="note" defaultValue={profile?.note ?? ''} maxLength={160} className="mt-1 w-full theme-chip-box px-2.5 py-2 text-xs" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="submit" className="theme-btn-primary rounded-xl px-2.5 py-2 text-xs font-bold">Save manual PSU</button>
            <button type="button" onClick={clear} className="theme-chip-box rounded-xl px-2.5 py-2 text-xs font-bold">Clear PSU</button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  )
}
