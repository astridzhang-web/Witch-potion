import { test, expect, type Page } from '@playwright/test'
import presets from '../src/game/presets.json' with { type: 'json' }
import { planPour, type Board } from '../src/game/rules'

const key = 'moonlit-alchemy.save.v1'
function completed(dismissed = false) {
  const preset = presets[0]
  let board = preset.board as Board
  const history: Board[] = []
  for (const [a, b] of preset.solution) { history.push(board); board = planPour(board, a, b)!.after }
  return { version: 3, showSymbols: false, session: { puzzle: { presetId: preset.id, initial: preset.board }, board, history },
    completion: { totalCompleted: 1, currentPuzzleCounted: true, settlementDismissed: dismissed },
    rewards: { balance: 2, baseClaimed: true, bonusClaimed: true, lastAward: 2, completionDelta: 1 } }
}
async function open(page: Page, dismissed = false) {
  await page.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save)) }, { key, save: completed(dismissed) })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
}
const nextButton = (page: Page) => page.getByRole('button', { name: '新谜题', exact: true })

test('solid flip gates input; independent dust starts after landing, and clears on manual new puzzle', async ({ page }) => {
  await page.clock.install()
  await open(page)
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  await page.keyboard.press('Escape')
  await expect(nextButton(page)).toBeDisabled()
  await expect(page.getByTestId('center-panel')).toHaveAttribute('data-turning', 'true')
  expect(await page.locator('.magic-mote').first().evaluate(el => getComputedStyle(el).animationPlayState)).toBe('paused')
  await page.clock.runFor(600)
  await expect(nextButton(page)).toBeDisabled()
  await page.clock.runFor(60)
  await expect(nextButton(page)).toBeEnabled()
  await expect(nextButton(page)).toBeFocused()
  await expect(page.getByTestId('center-panel')).toHaveAttribute('data-turning', 'false')
  await expect(page.locator('.panel-edge')).toHaveCount(4)
  // At rest the top edge projects almost edge-on; measure its actual plane thickness,
  // not the transient projected height while the browser's CSS timeline catches up.
  expect(await page.locator('.panel-edge-top').evaluate(el => parseFloat(getComputedStyle(el).height))).toBeGreaterThan(2)
  const particles = page.locator('.magic-mote')
  expect(await particles.count()).toBeGreaterThanOrEqual(30)
  const phases = await particles.evaluateAll(nodes => nodes.map(el => getComputedStyle(el).animationDelay))
  expect(new Set(phases).size).toBe(phases.length)
  const periods = await particles.evaluateAll(nodes => nodes.map(el => parseFloat(getComputedStyle(el).animationDuration)))
  expect(Math.min(...periods)).toBeGreaterThanOrEqual(1.5)
  expect(Math.max(...periods)).toBeLessThanOrEqual(3)
  const mote = particles.nth(7)
  // Seek the real CSS animation to verify outward motion and lifecycle fade.
  const motion = await mote.evaluate(el => {
    const animation = el.getAnimations()[0]
    animation.pause()
    const timing = animation.effect!.getTiming(), duration = Number(timing.duration)
    const at = (progress: number) => { animation.currentTime = Number(timing.delay) + duration * (5 + progress); return { transform: getComputedStyle(el).transform, opacity: Number(getComputedStyle(el).opacity) } }
    const start = at(.01), bright = at(.44), end = at(.99)
    animation.play()
    return { start, bright, end }
  })
  expect(motion.end.transform).not.toBe(motion.start.transform)
  expect(motion.bright.opacity).toBeGreaterThan(motion.start.opacity)
  expect(motion.bright.opacity).toBeGreaterThan(motion.end.opacity)
  const node = await mote.elementHandle()
  await page.getByRole('button', { name: '玩法说明' }).click()
  await page.getByRole('button', { name: '关闭', exact: true }).click()
  expect(await mote.evaluate((el, previous) => el === previous, node)).toBe(true)
  expect(await particles.evaluateAll(nodes => nodes.map(el => getComputedStyle(el).animationDelay))).toEqual(phases)
  await page.clock.resume()
  await nextButton(page).click()
  await expect(page.getByTestId('moves')).toHaveText('0')
  await expect(page.getByTestId('center-panel')).toHaveAttribute('data-face', 'star')
  await expect(page.locator('.panel-stardust')).toHaveCSS('opacity', '0')
  await expect(page.locator('.panel-brass-glow')).toHaveCSS('opacity', '0')
  expect(await particles.first().evaluate(el => getComputedStyle(el).animationPlayState)).toBe('paused')
})

test('restored back has no new flip or reward; glow and particles never intercept the button', async ({ page }) => {
  await open(page, true)
  const panel = page.getByTestId('center-panel')
  await expect(panel).toHaveAttribute('data-ready', 'true')
  await expect(panel).toHaveAttribute('data-turning', 'false')
  expect(await page.locator('.panel-rotor').evaluate(el => el.getAnimations().length)).toBe(0)
  for (const selector of ['.panel-brass-glow', '.panel-stardust', '.magic-mote']) {
    expect(await page.locator(selector).first().evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none')
  }
  expect(await page.locator('.panel-stardust').evaluate(el => getComputedStyle(el).overflow)).toBe('visible')
  const saved = await page.evaluate(key => localStorage.getItem(key), key)
  await page.reload()
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(saved)
  await expect(panel).toHaveAttribute('data-ready', 'true')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: '重来', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(nextButton(page)).toBeFocused()
  expect(await nextButton(page).evaluate(el => getComputedStyle(el).textDecorationLine)).toBe('none')
  await expect(page.locator('.panel-brass-glow')).toHaveCSS('opacity', '1')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('moves')).toHaveText('0')
})

test('reduced motion has only static glints, including when toggled during a turn', async ({ page }) => {
  await open(page)
  await page.keyboard.press('Escape')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(nextButton(page)).toBeEnabled()
  expect(await page.locator('.center-panel').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0)
  expect(await page.locator('.magic-mote').evaluateAll(nodes => nodes.filter(el => Number(getComputedStyle(el).opacity) > 0).length)).toBe(4)
  await expect(page.locator('.panel-stardust')).toHaveCSS('opacity', '1')
  await nextButton(page).click()
  await expect(page.locator('.panel-stardust')).toHaveCSS('opacity', '0')
  await expect(page.locator('.panel-rotor')).toHaveCSS('transform', 'none')
})

test('loaded fonts preserve centered middle label, mirrored side groups and icon clearance and symmetric stars at every viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, true)
  expect(await page.evaluate(() => document.fonts.check('14px "Moonlit Display"', '新谜题') && document.fonts.check('500 12px "Moonlit Text"', '已完成'))).toBe(true)
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport)
    for (const selector of ['.panel-button', '.new-puzzle-panel']) {
      for (const button of await page.locator(selector).all()) {
        const box = (await button.boundingBox())!
        const label = (await button.locator(selector === '.panel-button' ? '.panel-content > span' : '.panel-label').boundingBox())!
        if (selector !== '.panel-button') expect(Math.abs(label.x + label.width / 2 - box.x - box.width / 2)).toBeLessThan(.6)
        expect(Math.abs(label.y + label.height / 2 - box.y - box.height / 2)).toBeLessThan(.6)
        expect(label.x).toBeGreaterThan(box.x + 8)
        expect(label.x + label.width).toBeLessThan(box.x + box.width - 8)
        if (selector === '.panel-button') {
          const icon = (await button.locator('svg').boundingBox())!
          if ((await button.getAttribute('class'))!.includes('undo')) expect(icon.x + icon.width).toBeLessThan(label.x - 1)
          else expect(label.x + label.width).toBeLessThan(icon.x - 1)
          expect(icon.x).toBeGreaterThan(box.x + 4)
          expect(Math.abs(icon.y + icon.height / 2 - label.y - label.height / 2)).toBeLessThan(.6)
        }
      }
    }
    const stars = await page.locator('.panel-star').evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect().toJSON()))
    const label = (await page.locator('.panel-label').boundingBox())!
    expect(Math.abs((label.x - stars[0].x - stars[0].width) - (stars[1].x - label.x - label.width))).toBeLessThan(.6)
    expect(stars[0].width).toBeCloseTo(stars[1].width, 3)
    expect(Math.abs(stars[0].y - stars[1].y)).toBeLessThan(.1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('late font delivery does not shift panel or label centers; fallback remains usable', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/fonts/*.woff2', async route => { await gate; await route.continue() })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.panel-button').first()).toBeVisible()
  const centers = () => page.locator('.panel-content').evaluateAll(nodes => nodes.map(el => { const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }))
  const before = await centers()
  release()
  await page.evaluate(() => document.fonts.ready)
  const after = await centers()
  for (let i = 0; i < before.length; i++) {
    expect(Math.abs(before[i].x - after[i].x)).toBeLessThan(.6)
    expect(Math.abs(before[i].y - after[i].y)).toBeLessThan(.6)
  }
  await page.getByRole('button', { name: '玩法说明' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
})
