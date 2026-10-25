import { test, expect, type Page } from '@playwright/test'
import type { Board } from '../src/game/rules'
import presets from '../src/game/presets.json' with { type: 'json' }
import { createSession, pourSession } from '../src/game/session'

const key = 'moonlit-alchemy.save.v1', preset = presets[0]
function save(won = true, dismissed = true) {
  let session = createSession({ presetId: preset.id, initial: preset.board as Board })
  for (const [a, b] of preset.solution.slice(0, won ? undefined : 5)) session = pourSession(session, a, b)!.session
  return { session, version: 3, showSymbols: true,
    completion: { totalCompleted: Number(won), currentPuzzleCounted: won, settlementDismissed: won && dismissed },
    rewards: { balance: won ? 2 : 0, baseClaimed: won, bonusClaimed: won, lastAward: won ? 2 : 0, completionDelta: Number(won) } }
}
async function open(page: Page, value = save()) {
  await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value)) }, { key, value })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
}

test('HUD groups stay inside the artwork shoulder spaces with 1–3 digits; help stays at the viewport edge', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 320, height: 568 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport)
    for (const [count, moves] of [['1', '9'], ['12', '34'], ['123', '123']]) {
      // Presentation-only digit fixtures; do not forge a saved move history.
      await page.getByTestId('total-completed').evaluate((el, text) => { el.textContent = text }, count)
      await page.getByTestId('moves').evaluate((el, text) => { el.textContent = text }, moves)
      const stage = (await page.locator('.cabinet-scene').boundingBox())!
      const left = (await page.locator('.completion-stat').boundingBox())!
      const right = (await page.locator('.move-stat').boundingBox())!
      // Independently read from the source illustration: negative space above the
      // sloping shoulders, inside the outer pillars and outside the moon crest.
      // Test the whole label (including three digits), not implementation anchors.
      for (const [box, minX, maxX] of [[left, 65, 285], [right, 555, 780]] as const) {
        expect((box.x - stage.x) / stage.width * 841).toBeGreaterThan(minX)
        expect((box.x + box.width - stage.x) / stage.width * 841).toBeLessThan(maxX)
        expect((box.y - stage.y) / stage.height * 1870).toBeGreaterThan(80)
        expect((box.y + box.height - stage.y) / stage.height * 1870).toBeLessThan(165)
      }
      const help = (await page.locator('.help-button').boundingBox())!
      expect(help.x >= right.x + right.width || help.y + help.height <= right.y).toBe(true)
      expect(viewport.width - help.x - help.width).toBeCloseTo(4, 0)
      expect(help.y).toBeCloseTo(4, 0)
      expect(help.width).toBeGreaterThanOrEqual(44)
      expect(help.height).toBeGreaterThanOrEqual(44)
    }
  }
})

test('plain help closes by outside tap, button and Escape without changing saved gameplay', async ({ page }) => {
  await open(page, save(false))
  const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)
  const before = await read()
  expect(before).not.toHaveProperty('showSymbols')
  expect(before.session).toEqual(save(false).session)
  await expect(page.locator('.bottle-art text')).toHaveCount(0)
  for (const close of ['outside', 'button', 'escape']) {
    await page.getByRole('button', { name: '玩法说明' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('li')).toHaveCount(4)
    await expect(dialog.getByRole('checkbox')).toHaveCount(0)
    await expect(page.getByText('颜色符号')).toHaveCount(0)
    await dialog.locator('li').first().click()
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate(el => getComputedStyle(el, '::backdrop').backdropFilter)).toContain('blur')
    if (close === 'outside') await page.mouse.click(5, 5)
    else if (close === 'button') await page.getByRole('button', { name: '关闭', exact: true }).click()
    else await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    expect(await read()).toEqual(before)
  }
  await page.reload()
  expect(await read()).toEqual(before)
  await expect(page.locator('.bottle-art text')).toHaveCount(0)
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.getByTestId('moves')).toHaveText('4')
})

test('mixed brass glow remains strong after 1, 5 and 10 seconds without hover or focus', async ({ page }) => {
  await open(page, save(true, false))
  await page.getByRole('button', { name: '收起结算' }).click()
  await expect(page.getByTestId('center-panel')).toHaveAttribute('data-ready', 'true')
  const next = page.getByRole('button', { name: '新谜题', exact: true })
  await next.evaluate(el => (el as HTMLElement).blur())
  await page.mouse.move(0, 0)
  let elapsed = 0
  const values: number[] = []
  for (const seconds of [1, 5, 10]) {
    await page.waitForTimeout((seconds - elapsed) * 1000)
    elapsed = seconds
    expect(await next.evaluate(el => el.matches(':hover') || el.matches(':focus-visible'))).toBe(false)
    const opacity = Number(await page.locator('.panel-brass-glow').evaluate(el => getComputedStyle(el).opacity))
    expect(opacity).toBeGreaterThanOrEqual(.9)
    values.push(opacity)
  }
  expect(new Set(values).size).toBe(1)
  const colors = await page.locator('.panel-brass-glow path').evaluateAll(nodes => nodes.map(el => getComputedStyle(el).stroke))
  expect(new Set(colors).size).toBe(3)
  await next.focus()
  expect(Number(await page.locator('.panel-brass-glow').evaluate(el => getComputedStyle(el).opacity)) - values[0]).toBeLessThan(.11)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.panel-brass-glow')).toHaveCSS('opacity', '1')
  expect(await page.locator('.panel-stardust').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0)
})
