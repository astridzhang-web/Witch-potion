import { test, expect, type Page } from '@playwright/test'
import presets from '../src/game/presets.json' with { type: 'json' }
import { createSession, pourSession } from '../src/game/session'
import type { Board } from '../src/game/rules'

const key = 'moonlit-alchemy.save.v1', preset = presets[0]
function fixture(step: number) {
  let session = createSession({ presetId: preset.id, initial: preset.board as Board })
  for (const [from, to] of preset.solution.slice(0, step)) session = pourSession(session, from, to)!.session
  return { session, completion: { totalCompleted: 7, currentPuzzleCounted: false, settlementDismissed: false },
    rewards: { balance: 13, baseClaimed: false, bonusClaimed: false, lastAward: 0, completionDelta: 0 }, version: 3 }
}
async function open(page: Page, step: number, frozen = false) {
  if (frozen) { await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000)) }
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value))
  }, { key, value: fixture(step) })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
}
const read = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)
async function layout(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      return [r.x, r.y, r.width, r.height]
    }
    return {
      hud: [...document.querySelectorAll('.completion-stat, .move-stat, .help-button')].map(box),
      bottles: [...document.querySelectorAll<SVGSVGElement>('.board .bottle-art')].map(svg => {
        const m = svg.getScreenCTM()!
        return { matrix: [m.a, m.b, m.c, m.d, m.e, m.f], kind: svg.dataset.kind,
          level: svg.dataset.fillLevel,
          contents: svg.closest('button')!.getAttribute('data-liquid'),
          cavity: svg.querySelector('clipPath path')!.getAttribute('d'),
          textures: [...svg.querySelectorAll('image')].map(el => el.getAttribute('href')) }
      }),
    }
  })
}

test('liquid comparison only changes rendering; validated saves, HUD, bottle geometry and empty glass survive switching', async ({ page }) => {
  await open(page, 5)
  const saved = await read(page), before = await layout(page)
  expect(saved.completion.totalCompleted).toBe(7)
  expect(saved.rewards.balance).toBe(13)
  expect(saved.session.history).toHaveLength(5)
  for (const [url, finish] of [['/?liquid=legacy', 'legacy'], ['/?liquid=polished', 'polished'], ['/', 'polished']]) {
    await page.goto(url)
    await page.evaluate(() => document.fonts.ready)
    expect(await page.locator('.board .bottle-art').evaluateAll(nodes => nodes.map(el => el.getAttribute('data-liquid-finish')))).toEqual(Array(9).fill(finish))
    expect(await read(page)).toEqual(saved)
    expect(await layout(page)).toEqual(before)
    const empty = page.getByTestId('bottle-0')
    await expect(empty).toHaveAttribute('data-liquid', '')
    await expect(empty.locator('.liquid-layer, .liquid-surface, .liquid-meniscus, .liquid-wall-depth')).toHaveCount(0)
    await expect(empty.locator('.moon-glass-art')).toHaveAttribute('data-finish', 'star-moon')
  }
})

test('polished liquid stays consistent in source and receiving sprites, preserves gravity, then undoes and restores', async ({ page }) => {
  await open(page, 0, true)
  for (let step = 0; step < 2; step++) {
    const [from, to] = preset.solution[step]
    await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
    await page.clock.runFor(200)
    await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
    await page.clock.runFor(430)
    await expect(page.getByTestId('pour-animation')).toHaveAttribute('data-phase', 'pour')
    for (const sprite of ['.flying-bottle', '.receiving-sprite']) {
      await expect(page.locator(`${sprite} .bottle-art`)).toHaveAttribute('data-liquid-finish', 'polished')
    }
    const drawing = await page.evaluate(() => {
      const world = (path: SVGPathElement, end: boolean) => path.getPointAtLength(end ? path.getTotalLength() : 0).matrixTransform(path.getScreenCTM()!)
      const lip = world(document.querySelector('.wet-lip')!, true)
      const stream = world(document.querySelector('.potion-stream > path')!, false)
      return {
        gap: Math.hypot(lip.x - stream.x, lip.y - stream.y),
        slopes: [...document.querySelectorAll<SVGPathElement>('.flying-bottle .liquid-boundary')].map(path => Math.abs(world(path, false).y - world(path, true).y)),
      }
    })
    expect(drawing.gap).toBeLessThan(.2)
    expect(drawing.slopes.length).toBeGreaterThan(0)
    for (const slope of drawing.slopes) expect(slope).toBeLessThan(.1)
    await page.clock.runFor(600)
    await expect(page.getByTestId('pour-animation')).toHaveCount(0)
    expect((await read(page)).session).toEqual(fixture(step + 1).session)
  }
  await page.getByRole('button', { name: '撤销', exact: true }).dispatchEvent('click')
  await page.reload()
  expect((await read(page)).session).toEqual(fixture(1).session)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const [from, to] = preset.solution[1]
  await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
  await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
  const saved = await read(page)
  expect(saved.session).toEqual(fixture(2).session)
  expect(saved.completion).toEqual(fixture(2).completion)
  expect(saved.rewards).toEqual(fixture(2).rewards)
  await expect(page.getByTestId('bottle-0').locator('.bottle-art')).toHaveAttribute('data-liquid-finish', 'polished')
})
