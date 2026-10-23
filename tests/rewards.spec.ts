import { test, expect, type Page } from '@playwright/test'
import data from '../src/game/presets.json' with { type: 'json' }
import type { Preset } from '../src/game/puzzles'
const PRESETS = data as unknown as readonly Preset[]
import { createSession, pourSession } from '../src/game/session'

const preset = PRESETS[0], puzzle = { presetId: preset.id, initial: preset.board }
const key = 'moonlit-alchemy.save.v1'
function beforeWin(slow = false) {
  let session = createSession(puzzle)
  const moves = slow ? [[0, 8], [8, 7], ...preset.solution.slice(1)] : preset.solution
  for (const [a, b] of moves.slice(0, -1)) session = pourSession(session, a, b)!.session
  return { session, version: 3, showSymbols: false, completion: { totalCompleted: 0, currentPuzzleCounted: false, settlementDismissed: false }, rewards: { balance: 0, baseClaimed: false, bonusClaimed: false, lastAward: 0, completionDelta: 0 } }
}
async function open(page: Page, slow = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(({ key, save }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save))
  }, { key, save: beforeWin(slow) })
  await page.goto('/')
}
async function finish(page: Page) {
  for (const i of preset.solution.at(-1)!) await page.getByTestId(`bottle-${i}`).click()
}
const stored = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)

for (const slow of [true, false]) {
  test(`${slow ? 'one' : 'two'} real crystals, truthful receipt and stable responsive parchment`, async ({ page }) => {
    await open(page, slow)
    await finish(page)
    const count = slow ? 1 : 2
    await expect(page.getByTestId('crystal-award')).toHaveText(`+${count}`)
    await expect(page.getByTestId('completion-delta')).toHaveText('+1')
    await expect(page.getByTestId('settlement-moves')).toHaveText(String(preset.solution.length + Number(slow)))
    await expect(page.locator('.reward-crystal')).toHaveCount(count)
    expect((await stored(page)).rewards.balance).toBe(count)
    const won = (await stored(page)).session.board
    for (const [width, height] of [[390, 844], [360, 640], [320, 568], [1280, 900]]) {
      await page.setViewportSize({ width, height })
      await expect(page.getByRole('button', { name: '收起结算' })).toBeInViewport()
      const close = (await page.getByRole('button', { name: '收起结算' }).boundingBox())!
      expect(close.width).toBeGreaterThanOrEqual(44)
      expect(close.height).toBeGreaterThanOrEqual(44)
      const paper = (await page.locator('.parchment').boundingBox())!
      const circle = (await page.locator('.settlement-crystal').boundingBox())!
      const crystals = await page.locator('.reward-crystal').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().toJSON()))
      for (const crystal of crystals) {
        expect(crystal.x).toBeGreaterThan(circle.x + circle.width * .15)
        expect(crystal.x + crystal.width).toBeLessThan(circle.x + circle.width * .85)
        expect(crystal.y).toBeGreaterThan(circle.y)
      }
      const center = crystals.reduce((sum, r) => sum + r.x + r.width / 2, 0) / count
      expect(center).toBeCloseTo(circle.x + circle.width / 2, 0)
      if (count === 2) expect(crystals[1].x - crystals[0].x - crystals[0].width).toBeLessThan(2)
      const reward = (await page.locator('.crystal-reward').boundingBox())!
      expect(reward.y).toBeGreaterThanOrEqual(circle.y + circle.height - 1)
      const receipt = (await page.locator('.completion-receipt').boundingBox())!
      expect(receipt.y).toBeGreaterThanOrEqual(reward.y + reward.height - 1)
      expect(receipt.x).toBeGreaterThan(paper.x)
      expect(receipt.x + receipt.width).toBeLessThan(paper.x + paper.width)
      const footer = (await page.locator('.settlement-copy').boundingBox())!
      expect(footer.y + footer.height).toBeLessThan(paper.y + paper.height * .94)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(page.locator('.cabinet-art')).toHaveAttribute('src', '/assets/shelf-tall.webp')
      expect(await page.locator('.reward-crystal').evaluateAll(nodes => nodes.every(n => (n as HTMLImageElement).complete && (n as HTMLImageElement).naturalWidth > 0))).toBe(true)
    }
    await page.reload()
    await expect(page.getByTestId('crystal-award')).toHaveText(`+${count}`)
    expect((await stored(page)).rewards.balance).toBe(count)
    expect((await stored(page)).session.board).toEqual(won)
    await page.keyboard.press('Escape')
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect((await stored(page)).rewards.balance).toBe(count)
  })
}

test('slow win then benchmark replay grants only missing bonus, then no further reward', async ({ page }) => {
  await open(page, true)
  await finish(page)
  await page.locator('.parchment h2').click()
  await page.getByRole('button', { name: '重来', exact: true }).click()
  await page.reload()
  for (const [a, b] of preset.solution) {
    await page.getByTestId(`bottle-${a}`).dispatchEvent('click')
    await page.getByTestId(`bottle-${b}`).dispatchEvent('click')
  }
  await expect(page.getByTestId('crystal-award')).toHaveText('+1')
  await expect(page.locator('.reward-crystal')).toHaveCount(1)
  await expect(page.getByTestId('completion-delta')).toHaveText('已记录')
  await expect(page.getByTestId('total-completed')).toHaveText('1')
  expect((await stored(page)).rewards.balance).toBe(2)
  await page.reload()
  await expect(page.getByTestId('crystal-award')).toHaveText('+1')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await finish(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((await stored(page)).rewards.lastAward).toBe(0)
  expect((await stored(page)).rewards.balance).toBe(2)
  await page.getByRole('button', { name: '新谜题', exact: true }).click()
  expect((await stored(page)).rewards).toEqual({ balance: 2, baseClaimed: false, bonusClaimed: false, lastAward: 0, completionDelta: 0 })
})

test('v2 pending receipt migrates without fictitious historical crystals or completion delta', async ({ page }) => {
  let session = beforeWin().session
  session = pourSession(session, ...preset.solution.at(-1)!)!.session
  await page.addInitScript(({ key, session }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({version: 2, session, showSymbols: true, completion: {totalCompleted: 9, currentPuzzleCounted: true, settlementDismissed: false}}))
  }, { key, session })
  await page.goto('/')
  for (let i = 0; i < 3; i++) {
    await expect(page.getByTestId('crystal-award')).toHaveText('+0')
    await expect(page.locator('.reward-crystal')).toHaveCount(0)
    await expect(page.getByTestId('completion-delta')).toHaveText('已记录')
    expect((await stored(page)).rewards.balance).toBe(0)
    expect((await stored(page)).completion.totalCompleted).toBe(9)
    await page.reload()
  }
})

test('brass glow follows enabled, hover and keyboard focus states without underlining or motion', async ({ page }) => {
  await open(page)
  await finish(page)
  await page.keyboard.press('Escape')
  const next = page.getByRole('button', { name: '新谜题', exact: true })
  await expect(next).toBeFocused()
  const glow = page.locator('.panel-brass-glow')
  expect(await next.evaluate(el => getComputedStyle(el).textDecorationLine)).toBe('none')
  const focused = Number(await glow.evaluate(el => getComputedStyle(el).opacity))
  expect(focused).toBeGreaterThan(.7)
  await next.evaluate(el => (el as HTMLElement).blur())
  await page.mouse.move(0, 0)
  const idle = Number(await glow.evaluate(el => getComputedStyle(el).opacity))
  expect(idle).toBeGreaterThan(0)
  expect(idle).toBeLessThan(focused)
  await next.hover()
  expect(Number(await glow.evaluate(el => getComputedStyle(el).opacity))).toBeGreaterThanOrEqual(idle)
  expect(await glow.evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  expect(await glow.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s')
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('moves')).toHaveText('0')
  expect(Number(await glow.evaluate(el => getComputedStyle(el).opacity))).toBe(0)
})
