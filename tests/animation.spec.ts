import { test, expect, type Page } from '@playwright/test'
import presets from '../src/game/presets.json' with { type: 'json' }
import { planPour, type Board } from '../src/game/rules'

const key = 'moonlit-alchemy.save.v1'
const preset = presets[0]
function fixture(step: number) {
  let board = preset.board as Board
  const history: Board[] = []
  for (const [from, to] of preset.solution.slice(0, step)) {
    history.push(board)
    board = planPour(board, from, to)!.after
  }
  return { version: 1, showSymbols: false, session: { puzzle: { presetId: preset.id, initial: preset.board }, board, history } }
}
async function open(page: Page, step = 0) {
  await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-22T00:01:00Z'))
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value))
  }, { key, value: fixture(step) })
  await page.goto('/')
}
async function begin(page: Page, step: number) {
  const [from, to] = preset.solution[step]
  // Dispatch avoids waiting for the intentionally frozen animation clock; normal touch/mouse
  // input is independently exercised by game.spec.ts, including a complete animated solve.
  await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
  await page.clock.runFor(200)
  await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
  return { from, to }
}

for (const [name, step] of [['upper to lower', 0], ['lower to upper', 1], ['faceted source to lower shelf', 2], ['adjacent same row, tilt left', 10], ['adjacent same row, tilt right', 12]] as const) {
  test(`floating pour: ${name}`, async ({ page }) => {
    await open(page, step)
    const source = page.getByTestId(`bottle-${preset.solution[step][0]}`).locator('svg')
    const resting = await source.evaluate((svg: SVGSVGElement) => {
      const m = svg.getScreenCTM()!
      return { x: m.e, y: m.f, scale: m.a }
    })
    const { from, to } = await begin(page, step)
    const overlay = page.getByTestId('pour-animation')
    await expect(overlay).toHaveAttribute('data-phase', 'lift')
    expect(await overlay.evaluate((node) => node.parentElement === document.body)).toBe(true)
    await expect(page.getByTestId(`bottle-${from}`)).toBeDisabled()
    await expect(page.getByRole('button', { name: '重来', exact: true })).toBeDisabled()
    await page.clock.runFor(430)
    await expect(overlay).toHaveAttribute('data-phase', 'pour')
    await expect(page.locator('.potion-stream')).toBeVisible()
    const before = fixture(step).session.board
    const expected = planPour(before, from, to)!
    const sourceLevel = Number(await page.locator('.flying-bottle svg').getAttribute('data-fill-level'))
    const targetLevel = Number(await page.locator('.receiving-sprite svg').getAttribute('data-fill-level'))
    expect(sourceLevel).toBeLessThan(before[from].length)
    expect(sourceLevel).toBeGreaterThan(expected.after[from].length)
    expect(targetLevel + sourceLevel).toBeCloseTo(before[from].length + before[to].length)
    await expect(page.locator('.potion-stream')).toHaveAttribute('data-color', String(expected.color))
    // Inspect actual rendered SVG transforms: liquid boundaries stay horizontal
    // while the surrounding glass tilts; the stream starts exactly at its wet lip.
    const geometry = await page.evaluate(() => {
      const world = (path: SVGPathElement, end: boolean) => path.getPointAtLength(end ? path.getTotalLength() : 0).matrixTransform(path.getScreenCTM()!)
      const lip = world(document.querySelector('.wet-lip')!, true)
      const stream = world(document.querySelector('.potion-stream > path')!, false)
      const boundaries = [...document.querySelectorAll<SVGPathElement>('.flying-bottle .liquid-boundary')]
      return { gap: Math.hypot(lip.x - stream.x, lip.y - stream.y), slopes: boundaries.map(p => Math.abs(world(p, false).y - world(p, true).y)) }
    })
    expect(geometry.gap).toBeLessThan(.2)
    for (const slope of geometry.slopes) expect(slope).toBeLessThan(.1)
    const kinds = ['round', 'pear', 'faceted']
    await expect(page.locator('.flying-bottle .bottle-art')).toHaveAttribute('data-kind', kinds[from % 3])
    await expect(page.locator('.receiving-sprite .bottle-art')).toHaveAttribute('data-kind', kinds[to % 3])
    const receivingY = await page.locator('.receiving-sprite .liquid-surface').evaluate((el: SVGPathElement) => el.getPointAtLength(0).matrixTransform(el.getScreenCTM()!).y)
    await page.clock.runFor(80)
    expect(await page.locator('.receiving-sprite .liquid-surface').evaluate((el: SVGPathElement) => el.getPointAtLength(0).matrixTransform(el.getScreenCTM()!).y)).toBeLessThan(receivingY)

    await expect(page.getByTestId('moves')).toHaveText(String(step))
    const flightRect = await page.locator('.flying-bottle').boundingBox()
    const viewport = page.viewportSize()!
    expect(flightRect!.x).toBeGreaterThanOrEqual(0)
    expect(flightRect!.x + flightRect!.width).toBeLessThanOrEqual(viewport.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.clock.runFor(180)
    await expect(overlay).toHaveAttribute('data-phase', 'return')
    await expect(page.getByTestId('moves')).toHaveText(String(step + 1))
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)
    expect(stored.session.board).toEqual(expected.after)
    await page.clock.runFor(310)
    await expect(overlay).toHaveCount(0)
    await expect(page.getByTestId(`bottle-${from}`)).toHaveAttribute('data-liquid', expected.after[from].join(','))
    const landed = await source.evaluate((svg: SVGSVGElement) => {
      const m = svg.getScreenCTM()!
      return { x: m.e, y: m.f, scale: m.a }
    })
    expect(landed.x).toBeCloseTo(resting.x, 1)
    expect(landed.y).toBeCloseTo(resting.y, 1)
    expect(landed.scale).toBeCloseTo(resting.scale, 3)
    await page.getByRole('button', { name: '撤销', exact: true }).dispatchEvent('click')
    await expect(page.getByTestId(`bottle-${from}`)).toHaveAttribute('data-liquid', before[from].join(','))
    await expect(page.getByTestId('moves')).toHaveText(String(step))
  })
}

test('rapid repeated input cannot queue conflicting moves or undo while pouring', async ({ page }) => {
  await open(page)
  for (let step = 0; step < 4; step++) {
    const { to } = await begin(page, step)
    await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
    await page.getByTestId('bottle-8').dispatchEvent('click')
    await page.getByRole('button', { name: '撤销', exact: true }).dispatchEvent('click')
    await page.locator('.new-puzzle-panel').dispatchEvent('click')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.clock.runFor(1_200)
    await expect(page.getByTestId('pour-animation')).toHaveCount(0)
    await expect(page.getByTestId('moves')).toHaveText(String(step + 1))
  }
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)
  expect(saved.session.board).toEqual(fixture(4).session.board)
  expect(saved.session.history).toHaveLength(4)
})

for (const event of ['resize', 'scroll', 'hidden'] as const) {
  test(`${event} during flight settles exactly once and releases input`, async ({ page }) => {
    await open(page)
    await begin(page, 0)
    await page.clock.runFor(350)
    await page.evaluate((event) => {
      if (event === 'hidden') {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true })
        document.dispatchEvent(new Event('visibilitychange'))
      } else window.dispatchEvent(new Event(event))
    }, event)
    await expect(page.getByTestId('pour-animation')).toHaveCount(0)
    await page.clock.runFor(2_000)
    await expect(page.getByTestId('moves')).toHaveText('1')
    await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeEnabled()
    await page.reload()
    await expect(page.getByTestId('moves')).toHaveText('1')
  })
}

test('refresh during uncommitted flight restores the last complete board', async ({ page }) => {
  await open(page)
  await begin(page, 0)
  await page.clock.runFor(400)
  await page.reload()
  await expect(page.getByTestId('moves')).toHaveText('0')
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('data-liquid', preset.board[0].join(','))
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
})

test('reduced motion applies the same pour immediately without a flight', async ({ page }) => {
  await open(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await begin(page, 0)
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
  await expect(page.getByTestId('moves')).toHaveText('1')
  await expect(page.getByTestId('bottle-7')).toHaveAttribute('data-liquid', '4,4')
})


test('contact shadow stays on the shelf, fades on lift, and never travels with the source', async ({ page }) => {
  await open(page)
  const source = page.getByTestId('bottle-0')
  const shadow = source.locator('.bottle-contact-shadow')
  const receiverShadow = page.getByTestId('bottle-7').locator('.bottle-contact-shadow')
  const originalShadow = (await shadow.boundingBox())!
  const originalArt = (await source.locator('svg').boundingBox())!
  const originalOpacity = Number(await shadow.evaluate(node => getComputedStyle(node).opacity))
  await source.dispatchEvent('click')
  await page.clock.runFor(200)
  expect((await source.locator('svg').boundingBox())!.y).toBeLessThan(originalArt.y)
  expect(await shadow.boundingBox()).toEqual(originalShadow)
  expect(Number(await shadow.evaluate(node => getComputedStyle(node).opacity))).toBeLessThan(originalOpacity)
  await source.dispatchEvent('click')
  await page.clock.runFor(200)
  expect(Number(await shadow.evaluate(node => getComputedStyle(node).opacity))).toBe(originalOpacity)
  await begin(page, 0)
  await expect(shadow).toBeHidden()
  await expect(receiverShadow).toBeVisible()
  await page.clock.runFor(430)
  await expect(page.getByTestId('pour-animation')).toHaveAttribute('data-phase', 'pour')
  await expect(page.locator('.pour-overlay .bottle-contact-shadow')).toHaveCount(0)
  // Guard against reintroducing the old flat under-bottle ellipse in shared sprite art.
  const belowGlass = await page.locator('.pour-overlay svg.bottle-art ellipse').evaluateAll(nodes =>
    nodes.some(node => Number(node.getAttribute('cy')) > 134))
  expect(belowGlass).toBe(false)
  await expect(shadow).toBeHidden()
  await page.clock.runFor(600)
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
  await expect(shadow).toBeVisible()
  await expect(receiverShadow).toBeVisible()
  expect(await shadow.boundingBox()).toEqual(originalShadow)
  expect(Number(await shadow.evaluate(node => getComputedStyle(node).opacity))).toBe(originalOpacity)
  await page.getByRole('button', { name: '撤销', exact: true }).dispatchEvent('click')
  await expect(page.getByTestId('bottle-7')).toHaveAttribute('data-liquid', '')
  await expect(receiverShadow).toBeVisible()
})
