import type { LanguageType, ThemeType } from '../types/hardware'

export const THEME_IDS = ['obsidian', 'blueprint', 'terminal', 'industrial', 'tokyo'] as const satisfies readonly ThemeType[]
export const DEFAULT_THEME: ThemeType = 'obsidian'

export interface ThemeOption {
  id: ThemeType
  name: string
  description: Record<LanguageType, string>
  swatches: readonly [string, string, string]
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Signal',
    description: { EN: 'Premium signal deck', VI: 'Bàn tín hiệu cao cấp' },
    swatches: ['#070b12', '#18c8ff', '#a3e635'],
  },
  {
    id: 'blueprint',
    name: 'Blueprint Lab',
    description: { EN: 'Technical drafting lab', VI: 'Phòng bản vẽ kỹ thuật' },
    swatches: ['#0b4db8', '#f7fbff', '#67e8f9'],
  },
  {
    id: 'terminal',
    name: 'Phosphor Terminal',
    description: { EN: 'Phosphor diagnostics', VI: 'Chẩn đoán phosphor' },
    swatches: ['#07110a', '#69f0a3', '#f5b942'],
  },
  {
    id: 'industrial',
    name: 'Industrial Amber',
    description: { EN: 'Rugged test equipment', VI: 'Thiết bị đo công nghiệp' },
    swatches: ['#eee9dc', '#262923', '#f07818'],
  },
  {
    id: 'tokyo',
    name: 'Neo Tokyo',
    description: { EN: 'Neon night telemetry', VI: 'Telemetry đêm neon' },
    swatches: ['#11152b', '#ff4db8', '#7aa2f7'],
  },
]

const LEGACY_THEME_MAP: Readonly<Record<string, ThemeType>> = {
  slate: 'obsidian',
  arctic: 'blueprint',
  matcha: 'terminal',
  latte: 'industrial',
  sakura: 'tokyo',
}

export function resolveStoredTheme(value: string | null): ThemeType {
  if (value && (THEME_IDS as readonly string[]).includes(value)) return value as ThemeType
  if (value && value in LEGACY_THEME_MAP) return LEGACY_THEME_MAP[value]
  return DEFAULT_THEME
}
