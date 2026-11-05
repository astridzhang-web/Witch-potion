import { test, expect, type Page } from '@playwright/test'
import presets from '../src/game/presets.json' with { type: 'json' }
import { createSession, pourSession } from '../src/game/session'
import type { Board } from '../src/game/rules'

const key = 'moonlit-alchemy.save.v1', preset = presets[0]
async function open(page: Page, step: number, frozen = false) {
  let session = createSession({ presetId: preset.id, initial: preset.board as Board })
  for (const [a, b] of preset.solution.slice(0, step)) session = pourSession(session, a, b)!.session
  if (frozen) { await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000)) }
  await page.addInitScript(({ key, session }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, session })) }, { key, session })
  await page.goto('/')
  await page.evaluate(async () => { const image = new Image(); image.src = '/assets/bottles/moon-glass-candle.webp'; await image.decode() })
}

test('only index zero has the supplied texture; native aspect, mouth and shelf contact align at phone sizes', async ({ page }) => {
  await open(page, 5)
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('data-liquid', '')
  await expect(page.locator('.board .moon-glass-art')).toHaveCount(1)
  for (let index = 1; index < 9; index++) {
    await expect(page.getByTestId(`bottle-${index}`).locator('image')).toHaveCount(0)
    await expect(page.getByTestId(`bottle-${index}`).locator('.bottle-art')).toHaveAttribute('data-kind', ['round', 'pear', 'faceted'][index % 3])
  }
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport)
    const result = await page.locator('.moon-glass-texture').evaluate((el: SVGImageElement) => {
      const m = el.getScreenCTM()!, s = el.ownerSVGElement!.getScreenCTM()!
      const point = (x: number, y: number, matrix: DOMMatrix) => new DOMPoint(x, y).matrixTransform(matrix)
      const rim = point(543, 52, m), expectedRim = point(50, 10, s)
      const foot = point(543, 1410, m), expectedFoot = point(50, 134, s)
      return { scaleX: Math.hypot(m.a, m.b), scaleY: Math.hypot(m.c, m.d),
        mouthError: Math.hypot(rim.x - expectedRim.x, rim.y - expectedRim.y),
        footError: Math.hypot(foot.x - expectedFoot.x, foot.y - expectedFoot.y),
        ratio: el.width.baseVal.value / el.height.baseVal.value }
    })
    const sizing = await page.locator('.board .bottle-art').evaluateAll(nodes => {
      const scales = nodes.map(el => (el as SVGSVGElement).getScreenCTM()!.a)
      const svg = nodes[0] as SVGSVGElement
      const hits = [[50, 14], [50, 100]].map(([x, y]) => {
        const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!)
        return document.elementFromPoint(p.x, p.y)?.closest('button')?.getAttribute('data-testid')
      })
      return { scales, hits }
    })
    // Requested 13% growth, independently compared against all unchanged prototypes.
    expect(sizing.scales[0] / sizing.scales[1]).toBeCloseTo(1.13, 3)
    for (const scale of sizing.scales.slice(1)) expect(scale).toBeCloseTo(sizing.scales[1], 5)
    expect(sizing.hits).toEqual(['bottle-0', 'bottle-0'])
    expect(result.ratio).toBe(.75)
    expect(result.scaleX).toBeCloseTo(result.scaleY, 6)
    expect(result.mouthError).toBeLessThan(.1)
    expect(result.footError).toBeLessThan(.1)
  }
})

for (const [role, step] of [['source', 0], ['receiver', 1]] as const) test(`formal ${role} keeps its texture through the flight, landing, undo and refresh`, async ({ page }) => {
  await open(page, step, true)
  const [from, to] = preset.solution[step]
  const bottle = page.getByTestId('bottle-0')
  const original = await bottle.getAttribute('data-liquid')
  await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
  await page.clock.runFor(200)
  await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
  await page.clock.runFor(430)
  const sprite = page.locator(role === 'source' ? '.flying-bottle' : '.receiving-sprite')
  await expect(sprite.locator('.moon-glass-texture')).toHaveAttribute('href', '/assets/bottles/moon-glass-candle.webp')
  await expect(sprite.locator('.bottle-art')).toHaveAttribute('data-kind', 'moon-glass')
  const pose = await sprite.locator('.moon-glass-texture').evaluate((el: SVGImageElement) => {
    const art = el.getScreenCTM()!, glass = el.ownerSVGElement!.getScreenCTM()!
    const mouth = new DOMPoint(543, 52).matrixTransform(art), expected = new DOMPoint(50, 10).matrixTransform(glass)
    return { distance: Math.hypot(mouth.x - expected.x, mouth.y - expected.y), skew: Math.abs(Math.hypot(art.a, art.b) - Math.hypot(art.c, art.d)) }
  })
  expect(pose.distance).toBeLessThan(.1)
  expect(pose.skew).toBeLessThan(.00001)
  if (role === 'receiver') await expect(sprite.locator('.liquid-cavity .receiving-flow')).toHaveCount(1)
  await page.clock.runFor(600)
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
  await expect(bottle.locator('.moon-glass-art')).toBeVisible()
  await expect(bottle.locator('.bottle-art')).toHaveAttribute('data-kind', 'moon-glass')
  await page.getByRole('button', { name: '撤销', exact: true }).dispatchEvent('click')
  await expect(bottle).toHaveAttribute('data-liquid', original!)
  await page.reload()
  await expect(bottle).toHaveAttribute('data-liquid', original!)
  await expect(bottle.locator('.moon-glass-art')).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
  await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
  await expect(bottle.locator('.moon-glass-art')).toBeVisible()
  await expect(page.getByTestId('moves')).toHaveText(String(step + 1))
})

test('internal original/candle comparison preserves saved state, geometry and liquid; original remains consistent in flight', async ({ page }) => {
  await open(page, 0, true)
  const bottle = page.getByTestId('bottle-0')
  const state = () => page.evaluate(key => localStorage.getItem(key), key)
  const drawing = () => bottle.locator('.bottle-art').evaluate((svg: SVGSVGElement) => ({
    matrix: new DOMMatrix([svg.getScreenCTM()!.a, svg.getScreenCTM()!.b, svg.getScreenCTM()!.c, svg.getScreenCTM()!.d, svg.getScreenCTM()!.e, svg.getScreenCTM()!.f]).toFloat64Array().join(),
    liquid: [...svg.querySelectorAll('.liquid-layer')].map(el => ({
      color: el.getAttribute('data-color'), y: el.querySelector('rect')!.getAttribute('y'),
      height: el.querySelector('rect')!.getAttribute('height'),
    })),
  }))
  const saved = await state(), candle = await drawing()
  await expect(bottle.locator('.moon-glass-art')).toHaveAttribute('data-finish', 'candle')
  await page.goto('/?glass=original')
  await expect(bottle.locator('.moon-glass-art')).toHaveAttribute('data-finish', 'original')
  await expect(bottle.locator('.moon-glass-texture')).toHaveAttribute('href', '/assets/bottles/moon-glass-source.webp')
  expect(await drawing()).toEqual(candle)
  expect(await state()).toBe(saved)
  await bottle.dispatchEvent('click')
  await page.clock.runFor(200)
  await page.getByTestId('bottle-7').dispatchEvent('click')
  await page.clock.runFor(430)
  await expect(page.locator('.flying-bottle .moon-glass-art')).toHaveAttribute('data-finish', 'original')
  await page.clock.runFor(600)
  await page.getByRole('button', { name: '撤销', exact: true }).dispatchEvent('click')
  await page.goto('/?glass=candle')
  await expect(bottle.locator('.moon-glass-art')).toHaveAttribute('data-finish', 'candle')
  expect(await drawing()).toEqual(candle)
  // Undo retains the existing persisted game and reward bookkeeping.
  expect(await state()).toBe(saved)
})
