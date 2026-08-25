import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('aerospec_lang', 'EN')
    localStorage.setItem('aerospec_theme', 'slate')
  })
  await page.goto('/')
})

test('switches through all five themes from settings', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  const themeSelect = page.getByLabel('Theme')

  for (const theme of ['arctic', 'latte', 'matcha', 'sakura', 'slate']) {
    await themeSelect.selectOption(theme)
    await expect(page.locator('html')).toHaveClass(new RegExp(`theme-${theme}`))
  }
})

test('captures dashboard theme baselines', async ({ page }) => {
  await page.locator('select[aria-label="Hardware profile"]').selectOption('full')
  await expect(page.getByText('Simulation', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('dashboard-slate.png', { animations: 'disabled' })

  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByLabel('Theme').selectOption('arctic')
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page).toHaveScreenshot('dashboard-arctic.png', { animations: 'disabled' })
})

test('captures and keyboard-checks AI, inspector, and Flex overlays', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'edge-1440', 'Overlay baselines use the review viewport')
  await page.locator('select[aria-label="Hardware profile"]').selectOption('full')

  const aiOpener = page.getByRole('button', { name: 'AI Advisor' })
  await aiOpener.click()
  const aiDialog = page.getByRole('dialog', { name: 'AeroSpec AI Hardware Upgrade Consultant' })
  await expect(aiDialog).toBeVisible()
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
  await expect(page).toHaveScreenshot('overlay-inspector.png', { animations: 'disabled' })
  await page.keyboard.press('Escape')
  await expect(inspector).toHaveCount(0)

  const flexOpener = page.getByRole('button', { name: 'Export Card' })
  await flexOpener.click()
  const flexDialog = page.getByRole('dialog', { name: 'AeroSpec Holographic Flex Card' })
  await expect(flexDialog).toBeVisible()
  await expect(page).toHaveScreenshot('overlay-flex.png', {
    animations: 'disabled',
  })
  await page.keyboard.press('Escape')
  await expect(flexDialog).toHaveCount(0)
  await expect(flexOpener).toBeFocused()
})
