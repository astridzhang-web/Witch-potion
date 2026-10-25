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
  await expect(page.locator('.cabinet-art')).toHaveAttribute('src', '/assets/shelf-tall.webp')
  await expect.poll(() => page.locator('.cabinet-art').evaluate((img: HTMLImageElement) => img.complete && [img.naturalWidth, img.naturalHeight])).toEqual([841, 1870])
}

// Independently inspected artwork regions, documented in assets/cabinet-tall-layout.md.
// These are surface/clearance bands, not copies of the chosen implementation anchors.
const shelfBands = [[660, 674], [1080, 1096], [1490, 1510]]
const bottleLanes = [[240, 260], [410, 431], [581, 601]]
const panelRegions = [
  { selector: '.undo-panel', x: [75, 281], centerX: [170, 185] },
  { selector: '.restart-panel', x: [560, 770], centerX: [655, 674] },
]
const panelY = [1540, 1677]
const panelCenterY = [1598, 1618]
for (const [width, height] of [[390, 844], [360, 640], [320, 568], [1280, 900]]) {
  test(`tall cabinet alignment and complete scrollable framing at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await open(page)
    const stage = (await page.locator('.cabinet-scene').boundingBox())!
    const art = (await page.locator('.cabinet-art').boundingBox())!
    expect(art).toEqual(stage)
    expect(art.width / art.height).toBeCloseTo(841 / 1870, 3)
    expect(stage.x).toBeGreaterThanOrEqual(0)
    expect(stage.y).toBeGreaterThanOrEqual(0)
    expect(stage.x + stage.width).toBeLessThanOrEqual(width + .1)
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(stage.y + stage.height).toBeLessThanOrEqual(pageHeight + .5)
    // Preserve the existing 280px minimum scene width: only the narrow/short case scrolls.
    if (height >= 640) expect(stage.y + stage.height).toBeLessThanOrEqual(height + .1)
    else expect(stage.width).toBeGreaterThanOrEqual(280)
    expect(Math.abs(stage.x + stage.width / 2 - width / 2)).toBeLessThan(.1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    expect(pageHeight).toBeLessThanOrEqual(Math.max(height, Math.ceil(stage.y + stage.height)))
    const scale = stage.width / 841
    const within = (value: number, band: number[]) => {
      expect(value).toBeGreaterThanOrEqual(band[0])
      expect(value).toBeLessThanOrEqual(band[1])
    }
    const contacts = await page.locator('.board .bottle-art').evaluateAll((nodes) => nodes.map((node) => {
      const m = (node as SVGSVGElement).getScreenCTM()!
      return { x: m.a * 50 + m.e, y: m.d * 134 + m.f }
    }))
    expect(contacts).toHaveLength(9)
    for (let i = 0; i < contacts.length; i++) {
      within((contacts[i].x - stage.x) / scale, bottleLanes[i % 3])
      within((contacts[i].y - stage.y) / scale, shelfBands[Math.floor(i / 3)])
      const target = (await page.getByTestId(`bottle-${i}`).boundingBox())!
      expect(target.width).toBeGreaterThanOrEqual(44)
      expect(target.height).toBeGreaterThanOrEqual(44)
      const contactShadow = page.getByTestId(`bottle-${i}`).locator('.bottle-contact-shadow')
      await expect(contactShadow).toBeVisible()
      const shadow = (await contactShadow.boundingBox())!
      // Rendered shadow centers must touch the actual glass base, for full AND empty bottles.
      expect(shadow.x + shadow.width / 2).toBeCloseTo(contacts[i].x, 1)
      expect(shadow.y + shadow.height / 2).toBeCloseTo(contacts[i].y, 1)
      expect(shadow.height).toBeLessThan(target.height * .04)
      expect(shadow.width).toBeLessThan(target.width * .6)
      if (i % 3 < 2) {
        const next = (await page.getByTestId(`bottle-${i + 1}`).boundingBox())!
        expect(target.x + target.width).toBeLessThanOrEqual(next.x + .1)
      }
    }
    for (const region of panelRegions) {
      const hit = (await page.locator(region.selector).boundingBox())!
      expect(hit.width).toBeGreaterThanOrEqual(44)
      expect(hit.height).toBeGreaterThanOrEqual(44)
      within((hit.x + hit.width / 2 - stage.x) / scale, region.centerX)
      within((hit.y + hit.height / 2 - stage.y) / scale, panelCenterY)
      within((hit.x - stage.x) / scale, region.x)
      within((hit.x + hit.width - stage.x) / scale, region.x)
      within((hit.y - stage.y) / scale, panelY)
      within((hit.y + hit.height - stage.y) / scale, panelY)
      // The content retains a slight outward bias after the inward fine adjustment;
      // the mirrored right order is text/arrow, including on the smallest stage.
      const content = (await page.locator(`${region.selector} .panel-content`).boundingBox())!
      const offset = content.x + content.width / 2 - hit.x - hit.width / 2
      expect(region.selector.includes('undo') ? offset : -offset).toBeLessThan(-.5)
      expect(content.x).toBeGreaterThan(hit.x + 5)
      expect(content.x + content.width).toBeLessThan(hit.x + hit.width - 5)
    }
    await expect(page.locator('.controls').getByRole('button')).toHaveCount(2)
    const middleIsButton = await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('button'), {
      x: stage.x + stage.width / 2, y: stage.y + stage.height * 1608 / 1870,
    })
    expect(middleIsButton).toBe(false)
    await expect(page.locator('.scene-hud').getByRole('button', { name: '新谜题', exact: true })).toHaveCount(0)
    for (const selector of ['.completion-stat', '.move-stat']) {
      const hud = (await page.locator(selector).boundingBox())!
      expect(hud.x).toBeGreaterThanOrEqual(stage.x)
      expect(hud.x + hud.width).toBeLessThanOrEqual(stage.x + stage.width)
      expect(hud.y).toBeGreaterThanOrEqual(0)
      expect(hud.y + hud.height).toBeLessThanOrEqual(height)
    }
    await expect(page.getByRole('checkbox', { name: '颜色符号' })).toHaveCount(0)
    await expect(page.locator('.save-status')).toHaveCount(0)
    await page.locator('.board-message').scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: '重来', exact: true })).toBeInViewport()
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
  const at = (x: number) => ({ x: stage.x + x / 841 * stage.width, y: stage.y + 1608 / 1870 * stage.height })
  await move()
  const center = at(420.5)
  await tap(center.x, center.y)
  await expect(page.getByTestId('moves')).toHaveText('1')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const left = at(177)
  await tap(left.x, left.y)
  await expect(page.getByTestId('moves')).toHaveText('0')
  await move()
  const right = at(664)
  await tap(right.x, right.y)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '确认重来' }).click()
  await expect(page.getByTestId('moves')).toHaveText('0')
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('data-liquid', '4,6,4,4')
})
