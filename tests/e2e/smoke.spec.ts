import { expect, test } from '@playwright/test'

test('loads the AeroSpec dashboard', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/AeroSpec Pro/i)
  await expect(page.getByRole('heading', { name: /AeroSpec Pro/i })).toBeVisible()
})
