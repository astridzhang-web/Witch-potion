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

for (const [name, step] of [['upper to lower', 0], ['lower to upper', 1], ['adjacent same row, tilt left', 10], ['adjacent same row, tilt right', 12]] as const) {
  test(`floating pour: ${name}`, async ({ page }) => {
    await open(page, step)
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
    await expect(page.getByTestId('moves')).toHaveText(String(step))
    const flightRect = await page.locator('.flying-bottle').boundingBox()
    const viewport = page.viewportSize()!
    expect(flightRect!.x).toBeGreaterThanOrEqual(0)
    expect(flightRect!.x + flightRect!.width).toBeLessThanOrEqual(viewport.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.clock.runFor(260)
    await expect(overlay).toHaveAttribute('data-phase', 'return')
    await expect(page.getByTestId('moves')).toHaveText(String(step + 1))
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)
    expect(stored.session.board).toEqual(expected.after)
    await page.clock.runFor(310)
    await expect(overlay).toHaveCount(0)
    await expect(page.getByTestId(`bottle-${from}`)).toHaveAttribute('data-liquid', expected.after[from].join(','))
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
    await page.getByRole('button', { name: '新谜题', exact: true }).dispatchEvent('click')
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
