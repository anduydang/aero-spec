import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('aerospec_lang', 'EN')
  })
  await page.goto('/')
})

test('uses the Obsidian default and reports browser Live mode honestly', async ({ page }) => {
  await expect(page.locator('html')).toHaveClass(/theme-obsidian/)
  await expect(page.getByText('Live preview unavailable', { exact: false })).toBeVisible()
  await expect(page.getByText('Intel Core i5-8400', { exact: false })).toHaveCount(0)
})

test('migrates a legacy stored theme to the matching new identity', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('aerospec_theme', 'matcha'))
  await page.reload()

  await expect(page.locator('html')).toHaveClass(/theme-terminal/)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('aerospec_theme'))).toBe('terminal')
})

test('keeps secondary controls in a settings popover', async ({ page }) => {
  const settingsButton = page.getByRole('button', { name: 'Settings' })

  await expect(settingsButton).toBeVisible()
  await expect(page.getByRole('group', { name: 'Display and app settings' })).toHaveCount(0)
  await settingsButton.click()
  await expect(page.getByRole('group', { name: 'Display and app settings' })).toBeVisible()
  await expect(page.getByLabel('Theme')).toBeVisible()
  await expect(page.getByRole('button', { name: /language/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /sound/i })).toBeVisible()
})

test('has a readable, unclipped responsive shell', async ({ page }) => {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Viewport is required')

  const shell = page.locator('#root > div').first()
  const shellOverflow = await shell.evaluate((element) => getComputedStyle(element).overflowY)
  const bodyFontSize = await page.locator('footer p').first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize))
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

  expect(shellOverflow).not.toBe('hidden')
  expect(bodyFontSize).toBeGreaterThanOrEqual(12)
  expect(overflow).toBeLessThanOrEqual(1)

  if (viewport.width < 1280) {
    const sections = page.locator('main > section')
    const siliconBox = await sections.nth(0).boundingBox()
    const schematicBox = await sections.nth(1).boundingBox()
    expect(schematicBox?.y).toBeLessThan(siliconBox?.y ?? 0)
  }
})
