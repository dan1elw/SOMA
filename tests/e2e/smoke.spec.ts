import { test, expect } from '@playwright/test'

test.describe('SOMA smoke test', () => {
  test('app loads and renders the map', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/SOMA/)

    // The map canvas is rendered by MapLibre inside the main landmark.
    const main = page.getByRole('main')
    await expect(main).toBeVisible()

    // MapLibre creates a <canvas> element for WebGL rendering.
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
  })

  test('search input is accessible', async ({ page }) => {
    await page.goto('/')

    const search = page.getByRole('textbox', { name: /search satellites/i })
    await expect(search).toBeVisible()
    await expect(search).toBeEnabled()
  })

  test('search input accepts keyboard input and Escape clears focus', async ({ page }) => {
    await page.goto('/')

    const search = page.getByRole('textbox', { name: /search satellites/i })
    await search.fill('ISS')
    await expect(search).toHaveValue('ISS')

    // Escape should blur the input (no results shown for an offline/uncached catalog).
    await search.press('Escape')
    await expect(search).not.toBeFocused()
  })
})
