import { expect, test } from '@playwright/test'

test('uses the same hardware score in the footer and Flex Card', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('aerospec_lang', 'EN')
    localStorage.setItem('aerospec_theme', 'slate')
  })
  await page.goto('/')

  await page.locator('select').first().selectOption('full')
  const footerScoreText = await page.getByText(/\d+ \/ 100 \[Grade [SABCD]\]/).textContent()
  const footerScore = footerScoreText?.match(/\d+/)?.[0]

  await page.getByRole('button', { name: 'Export Card' }).click()
  const flexScore = await page
    .getByText('Synergy Rating')
    .locator('..')
    .locator('span.text-2xl')
    .textContent()

  expect(flexScore).toBe(footerScore)
})
