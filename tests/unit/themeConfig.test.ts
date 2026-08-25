import { describe, expect, it } from 'vitest'

import {
  DEFAULT_THEME,
  THEME_IDS,
  THEME_OPTIONS,
  resolveStoredTheme,
} from '../../src/theme/themeConfig'

describe('themeConfig', () => {
  it('defines the five approved themes in display order', () => {
    expect(DEFAULT_THEME).toBe('obsidian')
    expect(THEME_IDS).toEqual(['obsidian', 'blueprint', 'terminal', 'industrial', 'tokyo'])
    expect(THEME_OPTIONS.map(({ name }) => name)).toEqual([
      'Obsidian Signal',
      'Blueprint Lab',
      'Phosphor Terminal',
      'Industrial Amber',
      'Neo Tokyo',
    ])
  })

  it.each([
    ['slate', 'obsidian'],
    ['arctic', 'blueprint'],
    ['matcha', 'terminal'],
    ['latte', 'industrial'],
    ['sakura', 'tokyo'],
  ] as const)('migrates legacy theme %s to %s', (stored, expected) => {
    expect(resolveStoredTheme(stored)).toBe(expected)
  })

  it.each([null, '', 'SLATE', 'not-a-theme', '{broken-json'])('falls back for malformed value %s', (stored) => {
    expect(resolveStoredTheme(stored)).toBe(DEFAULT_THEME)
  })

  it('preserves every current theme ID', () => {
    for (const theme of THEME_IDS) {
      expect(resolveStoredTheme(theme)).toBe(theme)
    }
  })

  it('provides bilingual identity copy and three preview colors per theme', () => {
    for (const option of THEME_OPTIONS) {
      expect(option.description.EN.length).toBeGreaterThan(8)
      expect(option.description.VI.length).toBeGreaterThan(8)
      expect(option.swatches).toHaveLength(3)
      expect(option.swatches.every((swatch) => /^#[0-9a-f]{6}$/i.test(swatch))).toBe(true)
    }
  })
})
