import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('aerospec_lang', 'EN')
    if (!localStorage.getItem('aerospec_theme')) localStorage.setItem('aerospec_theme', 'obsidian')
  })
  await page.goto('/')
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; caret-color: transparent !important; }',
  })
})

test('switches through all five themes from settings', async ({ page }) => {
  const themes = [
    ['obsidian', 'Obsidian Signal'],
    ['blueprint', 'Blueprint Lab'],
    ['terminal', 'Phosphor Terminal'],
    ['industrial', 'Industrial Amber'],
    ['tokyo', 'Neo Tokyo'],
  ] as const

  for (const [theme, name] of themes) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    const radio = page.getByRole('radio', { name: new RegExp(name, 'i') })
    await radio.focus()
    await page.keyboard.press('Space')
    await expect(page.locator('html')).toHaveClass(new RegExp(`theme-${theme}`))
    await expect(radio).toBeChecked()
    await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--theme-identity').trim())).toBe(theme)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('aerospec_theme'))).toBe(theme)

    await page.reload()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await expect(page.getByRole('radio', { name: new RegExp(name, 'i') })).toBeChecked()
    await page.keyboard.press('Escape')
  }
})

test('captures dashboard theme baselines', async ({ page }, testInfo) => {
  await page.locator('select[aria-label="Hardware profile"]').selectOption('full')
  await expect(page.getByText('Simulation', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('dashboard-obsidian.png', { animations: 'disabled' })

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('radio', { name: /Blueprint Lab/i }).focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('Escape')
  await expect(page).toHaveScreenshot('dashboard-blueprint.png', { animations: 'disabled' })

  if (testInfo.project.name === 'edge-1440') {
    for (const [name, file] of [
      ['Phosphor Terminal', 'dashboard-terminal.png'],
      ['Industrial Amber', 'dashboard-industrial.png'],
      ['Neo Tokyo', 'dashboard-tokyo.png'],
    ] as const) {
      await page.getByRole('button', { name: 'Settings', exact: true }).click()
      await page.getByRole('radio', { name: new RegExp(name, 'i') }).focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('Escape')
      await expect(page).toHaveScreenshot(file, { animations: 'disabled' })
    }
  }
})

test('maintains readable semantic contrast in every theme', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'edge-1440', 'Contrast audit uses one deterministic rendering project')

  const themes = [
    ['Obsidian Signal', 'obsidian'],
    ['Blueprint Lab', 'blueprint'],
    ['Phosphor Terminal', 'terminal'],
    ['Industrial Amber', 'industrial'],
    ['Neo Tokyo', 'tokyo'],
  ] as const

  for (const [name, id] of themes) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByRole('radio', { name: new RegExp(name, 'i') }).focus()
    await page.keyboard.press('Space')

    const ratios = await page.locator('html').evaluate((element) => {
      const style = getComputedStyle(element)
      const rgb = (token: string) => {
        const value = style.getPropertyValue(token).trim()
        const match = /^#([0-9a-f]{6})$/i.exec(value)
        if (!match) throw new Error(`${token} must resolve to an opaque six-digit hex color, received ${value}`)
        const number = Number.parseInt(match[1], 16)
        return [(number >> 16) & 255, (number >> 8) & 255, number & 255]
      }
      const luminance = ([red, green, blue]: number[]) => {
        const channels = [red, green, blue].map((channel) => {
          const value = channel / 255
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
      }
      const contrast = (foreground: string, background: string) => {
        const first = luminance(rgb(foreground))
        const second = luminance(rgb(background))
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
      }
      return {
        mainOnCard: contrast('--text-main', '--card-solid'),
        mutedOnCard: contrast('--text-muted', '--card-solid'),
        mainOnChip: contrast('--text-main', '--chip-bg'),
        button: contrast('--button-text', '--primary-accent'),
        chipBoundary: contrast('--chip-border', '--chip-bg'),
      }
    })

    expect(ratios.mainOnCard, `${id} main/card`).toBeGreaterThanOrEqual(4.5)
    expect(ratios.mutedOnCard, `${id} muted/card`).toBeGreaterThanOrEqual(4.5)
    expect(ratios.mainOnChip, `${id} main/chip`).toBeGreaterThanOrEqual(4.5)
    expect(ratios.button, `${id} button`).toBeGreaterThanOrEqual(4.5)
    expect(ratios.chipBoundary, `${id} chip boundary`).toBeGreaterThanOrEqual(3)

    await page.keyboard.press('Escape')
  }
})

test('captures the visual theme picker', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'edge-1440', 'Theme picker baseline uses the review viewport')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const settings = page.getByRole('dialog', { name: 'Display and app settings' })
  await expect(settings).toBeVisible()
  await expect(settings.getByRole('radiogroup', { name: 'Theme' })).toBeVisible()
  await expect(settings).toHaveScreenshot('theme-picker-obsidian.png', { animations: 'disabled' })
})

test('captures and keyboard-checks AI, inspector, and Flex overlays', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'edge-1440', 'Overlay baselines use the review viewport')
  await page.locator('select[aria-label="Hardware profile"]').selectOption('full')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('radio', { name: /Blueprint Lab/i }).focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('Escape')

  const expectSemanticPanel = async (dialog: ReturnType<typeof page.getByRole>) => {
    await expect(dialog).toHaveClass(/overlay-panel/)
    await expect.poll(() => dialog.evaluate((element) => {
      const token = getComputedStyle(document.documentElement).getPropertyValue('--overlay-panel-bg').trim()
      const probe = document.createElement('span')
      probe.style.color = token
      document.body.append(probe)
      const resolvedToken = getComputedStyle(probe).color
      probe.remove()
      return getComputedStyle(element).backgroundColor === resolvedToken
    })).toBe(true)
  }

  const aiOpener = page.getByRole('button', { name: 'AI Advisor' })
  await aiOpener.click()
  const aiDialog = page.getByRole('dialog', { name: 'AeroSpec AI Hardware Upgrade Consultant' })
  await expect(aiDialog).toBeVisible()
  await expectSemanticPanel(aiDialog)
  await expect.poll(() => page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true)
  await page.keyboard.press('Shift+Tab')
  await expect.poll(() => page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true)
  await expect(page).toHaveScreenshot('overlay-ai.png', { animations: 'disabled' })
  await page.keyboard.press('Escape')
  await expect(aiDialog).toHaveCount(0)
  await expect(aiOpener).toBeFocused()

  await page.getByText('Processor Engine', { exact: true }).click()
  const inspector = page.getByRole('dialog', { name: /AMD Ryzen 7 7800X3D/ })
  await expect(inspector).toBeVisible()
  await expectSemanticPanel(inspector)
  await expect(page).toHaveScreenshot('overlay-inspector.png', { animations: 'disabled' })
  await page.keyboard.press('Escape')
  await expect(inspector).toHaveCount(0)

  const flexOpener = page.getByRole('button', { name: 'Export Card' })
  await flexOpener.click()
  const flexDialog = page.getByRole('dialog', { name: 'AeroSpec Holographic Flex Card' })
  await expect(flexDialog).toBeVisible()
  await expectSemanticPanel(flexDialog)
  await expect(page.getByTestId('export-flex-card')).toHaveCSS('background-color', 'rgb(11, 19, 41)')
  await expect(page).toHaveScreenshot('overlay-flex.png', {
    animations: 'disabled',
  })
  await page.keyboard.press('Escape')
  await expect(flexDialog).toHaveCount(0)
  await expect(flexOpener).toBeFocused()
})
