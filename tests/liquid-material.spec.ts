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
          label: svg.closest('button')!.getAttribute('aria-label'),
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
  for (const [url, finish] of [['/?liquid=legacy', 'legacy'], ['/?liquid=polished', 'polished'], ['/?liquid=unified', 'unified'], ['/?liquid=clean', 'clean'], ['/', 'clean']]) {
    await page.goto(url)
    await page.evaluate(() => document.fonts.ready)
    expect(await page.locator('.board .bottle-art').evaluateAll(nodes => nodes.map(el => el.getAttribute('data-liquid-finish')))).toEqual(Array(9).fill(finish))
    expect(await read(page)).toEqual(saved)
    expect(await layout(page)).toEqual(before)
    const empty = page.getByTestId('bottle-0')
    await expect(empty).toHaveAttribute('data-liquid', '')
    await expect(empty.locator('.liquid-layer, .liquid-surface, .liquid-meniscus, .liquid-wall-depth, .liquid-lighting')).toHaveCount(0)
    await expect(empty.locator('.moon-glass-art')).toHaveAttribute('data-finish', 'star-moon')
    const occupied = page.getByTestId('bottle-1')
    await expect(occupied.locator('.liquid-surface')).toHaveCount(1)
    const fills = await occupied.locator('.liquid-layer > rect').evaluateAll(nodes => nodes.map(el => el.getAttribute('fill')!))
    expect(fills.length).toBeGreaterThan(0)
    expect(fills.every(fill => fill.startsWith('url('))).toBe((finish === 'legacy' || finish === 'polished'))
    await expect(occupied.locator('.liquid-lighting')).toHaveCount((finish === 'unified' || finish === 'clean') ? 1 : 0)
  }
})

test('clean liquid stays consistent in source and receiving sprites, preserves gravity, then undoes and restores', async ({ page }) => {
  await open(page, 0, true)
  for (let step = 0; step < 2; step++) {
    const [from, to] = preset.solution[step]
    await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
    await page.clock.runFor(200)
    await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
    await page.clock.runFor(430)
    await expect(page.getByTestId('pour-animation')).toHaveAttribute('data-phase', 'pour')
    for (const sprite of ['.flying-bottle', '.receiving-sprite']) {
      await expect(page.locator(`${sprite} .bottle-art`)).toHaveAttribute('data-liquid-finish', 'clean')
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
  await expect(page.getByTestId('bottle-0').locator('.bottle-art')).toHaveAttribute('data-liquid-finish', 'clean')
})

test('unified uses one shared light and free surface, with weaker same-color unit hints than color contacts', async ({ page }) => {
  await open(page, 0)
  await page.goto('/?liquid=unified')
  const bottle = page.getByTestId('bottle-0')
  // Legal witness states: four units [gold, orchid, gold, gold], then two
  // [gold, orchid], then one [gold]. Expected interfaces come from these fixtures.
  for (const [step, colors, units] of [[0, 2, 1], [1, 1, 0], [4, 0, 0]] as const) {
    await page.evaluate(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key, save: fixture(step) })
    await page.reload()
    await expect(bottle.locator('.liquid-surface')).toHaveCount(1)
    await expect(bottle.locator('.liquid-lighting')).toHaveCount(1)
    await expect(bottle.locator('.liquid-boundary[data-boundary="color"]')).toHaveCount(colors)
    await expect(bottle.locator('.liquid-boundary[data-boundary="unit"]')).toHaveCount(units)
    await expect(bottle.locator('.liquid-boundary')).toHaveCount(colors + units)
    // Color rectangles are solid; changing color cannot restart a private gradient.
    const fills = await bottle.locator('.liquid-layer > rect').evaluateAll(nodes => nodes.map(el => el.getAttribute('fill')!))
    expect(fills.every(fill => /^#[0-9a-f]{6}$/i.test(fill))).toBe(true)
    if (units) {
      const strengths = await bottle.locator('.liquid-surface, .liquid-boundary').evaluateAll(nodes => nodes.map(el => {
        const style = getComputedStyle(el)
        return { role: el.classList.contains('liquid-surface') ? 'surface' : el.getAttribute('data-boundary'),
          strength: Number(style.opacity) * Number(style.strokeOpacity) * parseFloat(style.strokeWidth) }
      }))
      const strength = (role: string) => strengths.filter(value => value.role === role).map(value => value.strength)
      expect(Math.max(...strength('unit'))).toBeLessThan(Math.min(...strength('color')))
      expect(Math.max(...strength('color'))).toBeLessThan(Math.min(...strength('surface')))
    }
  }
})


test('clean upright units and soft seams remain equally spaced for one to four units and mixed colors', async ({ page }) => {
  await open(page, 0)
  const saved = await read(page)
  const cases = [[1], [1,1], [1,1,1], [1,1,1,1], [1,4,1,4]]
  let height = 0, previousTop = 0
  for (const liquid of cases) {
    await page.evaluate(async liquid => {
      const path = '/tests/fixtures/liquidPreview.tsx'
      const { renderLiquidFixture } = await import(path)
      renderLiquidFixture(liquid)
    }, liquid)
    const art = page.locator('[data-liquid-fixture] .bottle-art')
    await expect(art).toHaveAttribute('data-fill-level', String(liquid.length))
    // Wait for the color fixture as well when the final case has the same length.
    await expect(art.locator('.liquid-layer').last()).toHaveAttribute('data-color', String(liquid.at(-1)))
    // SVG DOM baseVal values use float32; 1e-4 SVG units is far below a screen pixel.
    const geometry = await art.evaluate((svg: SVGSVGElement) => {
      const rects = [...svg.querySelectorAll<SVGRectElement>('.liquid-layer > rect')]
      const seams = [...svg.querySelectorAll<SVGPathElement>('.liquid-boundary')]
      return { heights: rects.map(r => r.height.baseVal.value - .03),
        top: rects.at(-1)!.y.baseVal.value,
        seams: seams.map(p => ({ y: p.getPointAtLength(0).y, type: p.dataset.boundary, width: p.getAttribute('stroke-width'),
          stops: [...svg.querySelector(p.getAttribute('stroke')!.slice(4, -1))!.children].map(s => [s.getAttribute('stop-color'), s.getAttribute('stop-opacity')]) })) }
    })
    if (liquid.length === 1) height = geometry.heights[0]
    expect(geometry.heights).toHaveLength(liquid.length)
    for (const h of geometry.heights) expect(h).toBeCloseTo(height, 4)
    expect(geometry.seams).toHaveLength(liquid.length - 1)
    for (let i = 0; i < geometry.seams.length; i++) {
      expect(geometry.seams[i].y - geometry.top).toBeCloseTo((liquid.length - i - 1) * height, 4)
      expect(geometry.seams[i].type).toBe('seam')
      expect(geometry.seams[i].width).toBe('1.2')
      expect(geometry.seams[i].stops).toEqual(geometry.seams[0].stops)
      expect(geometry.seams[i].stops.every(([color]) => color === '#544d47')).toBe(true)
    }
    if (liquid.length > 1 && liquid.every(c => c === 1)) expect(previousTop - geometry.top).toBeCloseTo(height, 4)
    previousTop = geometry.top
    expect(await read(page)).toEqual(saved)
  }
  await page.goto('/?bottles=sample&liquid=unified')
  await expect(page.locator('.board .moon-glass-art')).toHaveCount(1)
  expect(await page.locator('.board .bottle-art').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-kind')))).toEqual([
    'moon-glass','pear','faceted','round','pear','faceted','round','pear','faceted',
  ])
  expect(await read(page)).toEqual(saved)
})
