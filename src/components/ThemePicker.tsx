import { Check } from 'lucide-react'

import { THEME_OPTIONS } from '../theme/themeConfig'
import type { LanguageType, ThemeType } from '../types/hardware'

interface ThemePickerProps {
  theme: ThemeType
  lang: LanguageType
  onSelectTheme: (theme: ThemeType) => void
}

export function ThemePicker({ theme, lang, onSelectTheme }: ThemePickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Theme</legend>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 gap-1.5">
        {THEME_OPTIONS.map((option) => {
          const selected = option.id === theme
          return (
            <label
              key={option.id}
              className={`theme-option-card ${selected ? 'is-selected' : ''}`}
            >
              <input
                type="radio"
                name="aerospec-theme"
                value={option.id}
                checked={selected}
                onChange={() => onSelectTheme(option.id)}
                className="sr-only"
                aria-label={`${option.name} — ${option.description[lang]}`}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-extrabold theme-title leading-tight">
                  {option.name}
                  {selected && <Check aria-hidden="true" className="w-3.5 h-3.5 theme-primary-text" />}
                </span>
                <span className="block mt-0.5 text-[11px] theme-muted font-medium">
                  {option.description[lang]}
                </span>
              </span>
              <span
                data-testid={`theme-swatches-${option.id}`}
                className="flex shrink-0 -space-x-1"
                aria-hidden="true"
              >
                {option.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className="h-4 w-4 rounded-full border border-white/50 shadow-sm"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
