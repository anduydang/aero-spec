import { expect, test } from '@playwright/test'

test('aligns product version and manages the locally stored Gemini key', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('aerospec_lang', 'EN')
    localStorage.setItem('aerospec_theme', 'obsidian')
    localStorage.removeItem('aerospec_gemini_key')
  })
  await page.goto('/')

  await expect(page.getByText('v2.6.0', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'AI Advisor' }).click()
  await page.getByRole('button', { name: 'Connect API Key' }).click()

  await expect(page.getByText(/stored locally in this app profile on this PC/i)).toBeVisible()
  await page.getByLabel('Gemini API Key').fill('test-local-key')
  await page.getByRole('button', { name: 'Save API Key' }).click()
  await expect(page.getByRole('button', { name: 'API Key Connected' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('aerospec_gemini_key'))).toBe('test-local-key')

  await page.getByRole('button', { name: 'API Key Connected' }).click()
  await page.getByRole('button', { name: 'Clear API Key' }).click()

  await expect(page.getByText('API Key Required', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('aerospec_gemini_key'))).toBeNull()
})
