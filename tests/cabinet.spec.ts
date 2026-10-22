import { test, expect, type Page } from '@playwright/test'
import presets from '../src/game/presets.json' with { type: 'json' }

const preset = presets[0]
async function open(page: Page) {
  await page.addInitScript((preset) => localStorage.setItem('moonlit-alchemy.save.v1', JSON.stringify({
    version: 1, showSymbols: false,
    session: { puzzle: { presetId: preset.id, initial: preset.board }, board: preset.board, history: [] },
  })), preset)
  await page.goto('/')
  await expect(page.locator('.cabinet-art')).toBeVisible()
  await expect.poll(() => page.locator('.cabinet-art').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(941)
}

// Independent image landmarks: shelf contact planes and inset panel centers were
// measured from the supplied PNG, not derived from the layout implementation.
for (const [width, height] of [[390, 844], [360, 640], [320, 568], [1280, 900]]) {
  test(`cabinet alignment and complete framing at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await open(page)
    const stage = (await page.locator('.cabinet-scene').boundingBox())!
    const art = (await page.locator('.cabinet-art').boundingBox())!
    expect(art).toEqual(stage)
    expect(art.width / art.height).toBeCloseTo(941 / 1672, 3)
    expect(stage.x).toBeGreaterThanOrEqual(0)
    expect(stage.y).toBeGreaterThanOrEqual(0)
    expect(stage.x + stage.width).toBeLessThanOrEqual(width + .1)
    expect(stage.y + stage.height).toBeLessThanOrEqual(height + .1)
    expect(Math.abs(stage.x + stage.width / 2 - width / 2)).toBeLessThan(.1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height)
    const contacts = await page.locator('.board .bottle-art').evaluateAll((nodes) => nodes.map((node) => {
      const m = (node as SVGSVGElement).getScreenCTM()!
      return { x: m.a * 50 + m.e, y: m.d * 134 + m.f }
    }))
    expect(contacts).toHaveLength(9)
    for (let i = 0; i < contacts.length; i++) {
      expect(Math.abs(contacts[i].x - (stage.x + [265, 470.5, 676][i % 3] / 941 * stage.width))).toBeLessThan(.15)
      expect(Math.abs(contacts[i].y - (stage.y + [628, 976, 1324][Math.floor(i / 3)] / 1672 * stage.height))).toBeLessThan(.15)
      const target = (await page.getByTestId(`bottle-${i}`).boundingBox())!
      expect(target.width).toBeGreaterThanOrEqual(44)
      expect(target.height).toBeGreaterThanOrEqual(44)
    }
    for (const [selector, x] of [['.undo-panel', 195], ['.restart-panel', 746]] as const) {
      const hit = (await page.locator(selector).boundingBox())!
      expect(hit.width).toBeGreaterThanOrEqual(44)
      expect(hit.height).toBeGreaterThanOrEqual(44)
      expect(Math.abs(hit.x + hit.width / 2 - (stage.x + x / 941 * stage.width))).toBeLessThan(.15)
      expect(Math.abs(hit.y + hit.height / 2 - (stage.y + 1425 / 1672 * stage.height))).toBeLessThan(.15)
    }
    await expect(page.locator('.controls button')).toHaveCount(2)
    const middleIsButton = await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('button'), {
      x: stage.x + stage.width / 2, y: stage.y + stage.height * 1425 / 1672,
    })
    expect(middleIsButton).toBe(false)
    await expect(page.locator('.scene-hud').getByRole('button', { name: '新谜题', exact: true })).toBeVisible()
  })
}

test('painted left/right panels are clickable, middle decoration does nothing', async ({ page }, info) => {
  await open(page)
  const tap = async (x: number, y: number) => {
    if (info.project.name === 'mobile') await page.touchscreen.tap(x, y)
    else await page.mouse.click(x, y)
  }
  const move = async () => {
    await page.getByTestId('bottle-0').click()
    await page.getByTestId('bottle-7').click()
    await expect(page.getByTestId('pour-animation')).toHaveCount(0)
    await expect(page.getByTestId('moves')).toHaveText('1')
  }
  const stage = (await page.locator('.cabinet-scene').boundingBox())!
  const at = (x: number) => ({ x: stage.x + x / 941 * stage.width, y: stage.y + 1425 / 1672 * stage.height })
  await move()
  const center = at(470.5)
  await tap(center.x, center.y)
  await expect(page.getByTestId('moves')).toHaveText('1')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const left = at(195)
  await tap(left.x, left.y)
  await expect(page.getByTestId('moves')).toHaveText('0')
  await move()
  const right = at(746)
  await tap(right.x, right.y)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '确认重来' }).click()
  await expect(page.getByTestId('moves')).toHaveText('0')
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('data-liquid', '4,6,4,4')
})
