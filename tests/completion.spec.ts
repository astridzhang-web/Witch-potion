import { test, expect, type Page } from '@playwright/test'
import presets from '../src/game/presets.json' with { type: 'json' }
import { planPour, type Board } from '../src/game/rules'

const key = 'moonlit-alchemy.save.v1'
const preset = presets[0]
const last = preset.solution.length - 1
function fixture(step: number) {
  let board = preset.board as Board
  const history: Board[] = []
  for (const [from, to] of preset.solution.slice(0, step)) {
    history.push(board)
    board = planPour(board, from, to)!.after
  }
  return { version: 1, showSymbols: true, session: { puzzle: { presetId: preset.id, initial: preset.board }, board, history } }
}
async function open(page: Page, step: number, frozen = false) {
  if (frozen) {
    await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') })
    await page.clock.pauseAt(new Date('2026-10-22T00:01:00Z'))
  }
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value))
  }, { key, value: fixture(step) })
  await page.goto('/')
}
async function finish(page: Page) {
  for (const index of preset.solution[last]) await page.getByTestId(`bottle-${index}`).dispatchEvent('click')
}
const stored = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)

test('compact HUD, silent save and inert star panel before completion', async ({ page }) => {
  await open(page, 0)
  await expect(page.getByRole('button', { name: '新谜题', exact: true })).toHaveCount(0)
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(page.getByText('进度已存于此设备')).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.locator('.new-puzzle-panel').dispatchEvent('click')
  await expect(page.getByTestId('moves')).toHaveText('0')
  expect((await stored(page)).session.puzzle.presetId).toBe(preset.id)
  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport)
    const label = (await page.locator('.move-stat > span').boundingBox())!
    const number = (await page.getByTestId('moves').boundingBox())!
    expect(number.x).toBeGreaterThan(label.x + label.width)
    expect(Math.abs(label.y + label.height / 2 - number.y - number.height / 2)).toBeLessThan(2)
    const completed = (await page.locator('.completion-stat').boundingBox())!
    expect(completed.x + completed.width).toBeLessThan(label.x)
    const help = (await page.getByRole('button', { name: '玩法说明' }).boundingBox())!
    expect(help.width).toBeGreaterThanOrEqual(44)
    expect(help.height).toBeGreaterThanOrEqual(44)
    expect(help.x).toBeGreaterThan(number.x + number.width)
    expect(help.y).toBeGreaterThanOrEqual(0)
  }
})

test('last pour returns before settlement; dismiss flips, focuses and persists; new puzzle is manual', async ({ page }) => {
  await open(page, last, true)
  await finish(page)
  await page.clock.runFor(700)
  await expect(page.getByTestId('pour-animation')).toHaveAttribute('data-phase', 'return')
  await expect(page.getByTestId('total-completed')).toHaveText('1')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByTestId('center-panel')).toHaveAttribute('data-face', 'star')
  await page.clock.runFor(300)
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: '调配完成' })).toBeVisible()
  await expect(page.getByTestId('settlement-moves')).toHaveText(String(last + 1))
  await page.reload()
  await expect(page.getByRole('dialog', { name: '调配完成' })).toBeVisible()
  await expect(page.getByTestId('total-completed')).toHaveText('1')
  await page.keyboard.press('Escape')
  const next = page.getByRole('button', { name: '新谜题', exact: true })
  await expect(next).toBeDisabled()
  await page.clock.runFor(600)
  await expect(next).toBeEnabled()
  await expect(next).toBeFocused()
  const saved = await stored(page)
  expect(saved.session.board).toEqual(fixture(last + 1).session.board)
  expect(saved.completion).toEqual({ totalCompleted: 1, currentPuzzleCounted: true, settlementDismissed: true })
  await page.reload()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(next).toBeEnabled()
  await page.locator('.new-puzzle-panel').evaluate(button => {
    for (let i = 0; i < 4; i++) (button as HTMLButtonElement).click()
  })
  await expect(page.getByTestId('moves')).toHaveText('0')
  await expect(page.getByTestId('center-panel')).toHaveAttribute('data-face', 'star')
  expect((await stored(page)).session.puzzle.presetId).toBe(presets[1].id)
  expect((await stored(page)).completion).toEqual({ totalCompleted: 1, currentPuzzleCounted: false, settlementDismissed: false })
})

test('v1 solved migration, undo and full restart replay do not count or celebrate twice', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, last + 1)
  await expect(page.getByRole('dialog', { name: '调配完成' })).toBeVisible()
  const migrated = await stored(page)
  expect(migrated.version).toBe(2)
  expect(migrated.session).toEqual(fixture(last + 1).session)
  expect(migrated.showSymbols).toBe(true)
  // Any non-button content tap dismisses the settlement too.
  await page.locator('.settlement-crystal').click()
  const next = page.getByRole('button', { name: '新谜题', exact: true })
  await expect(next).toBeEnabled()
  expect(await page.locator('.panel-rotor').evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.getByTestId('center-panel')).toHaveAttribute('data-face', 'star')
  await page.reload()
  await finish(page)
  await expect(page.getByTestId('total-completed')).toHaveText('1')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: '重来', exact: true }).click()
  await expect(page.getByTestId('moves')).toHaveText('0')
  await expect(page.getByTestId('center-panel')).toHaveAttribute('data-face', 'star')
  for (const [from, to] of preset.solution) {
    await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
    await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
  }
  await expect(page.getByTestId('total-completed')).toHaveText('1')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(next).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('moves')).toHaveText('0')
  for (const [from, to] of presets[1].solution) {
    await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
    await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
  }
  await expect(page.getByRole('dialog', { name: '调配完成' })).toBeVisible()
  await expect(page.getByTestId('total-completed')).toHaveText('2')
  await page.getByRole('button', { name: '收起结算' }).click()
  await expect(next).toBeEnabled()
})

for (const interrupted of ['refresh-before-commit', 'refresh-after-commit', 'repeated-resize'] as const) {
  test(`final-pour interruption: ${interrupted}`, async ({ page }) => {
    await open(page, last, true)
    await finish(page)
    await page.clock.runFor(interrupted === 'refresh-after-commit' ? 700 : 400)
    if (interrupted === 'repeated-resize') {
      await page.evaluate(() => { for (let i = 0; i < 3; i++) window.dispatchEvent(new Event('resize')) })
      await page.clock.runFor(1500)
    }
    await page.reload()
    if (interrupted === 'refresh-before-commit') {
      await expect(page.getByTestId('total-completed')).toHaveText('0')
      await expect(page.getByTestId('moves')).toHaveText(String(last))
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await finish(page)
      await page.clock.runFor(1100)
    }
    await expect(page.getByRole('dialog', { name: '调配完成' })).toBeVisible()
    await expect(page.getByTestId('total-completed')).toHaveText('1')
    await expect(page.getByTestId('moves')).toHaveText(String(last + 1))
    expect((await stored(page)).completion.totalCompleted).toBe(1)
  })
}

test('revealed panel fits mobile touch targets, uses opaque separate faces and keeps readable text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, last + 1)
  await page.keyboard.press('Escape')
  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport)
    const next = page.getByRole('button', { name: '新谜题', exact: true })
    await next.scrollIntoViewIfNeeded()
    const box = (await next.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.x).toBeGreaterThan(0)
    expect(box.x + box.width).toBeLessThan(viewport.width)
    const clicked = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
    expect(clicked).toBe('new-puzzle-panel')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  for (const face of ['front', 'back']) {
    expect(await page.locator(`.panel-${face}`).evaluate(node => getComputedStyle(node).backfaceVisibility)).toBe('hidden')
    expect(await page.locator(`.panel-${face}`).evaluate(node => getComputedStyle(node).backgroundImage)).toContain(face === 'front' ? 'panel-star.webp' : 'panel-back.webp')
  }
  expect(await page.getByTestId('center-panel').evaluate(node => getComputedStyle(node).backgroundImage)).toContain('panel-wood.webp')
})
