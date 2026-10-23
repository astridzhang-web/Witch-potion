import { test, expect, type Page, type TestInfo } from '@playwright/test'
import presets from '../src/game/presets.json' with { type: 'json' }

const saveKey = 'moonlit-alchemy.save.v1'
const initial = presets[0].board
const seedSave = { version: 1, session: { puzzle: { presetId: presets[0].id, initial }, board: initial, history: [] }, showSymbols: false }

async function openGame(page: Page) {
  await page.addInitScript(({ saveKey, seedSave }) => {
    if (!localStorage.getItem(saveKey)) localStorage.setItem(saveKey, JSON.stringify(seedSave))
  }, { saveKey, seedSave })
  await page.goto('/')
}
async function bottle(page: Page, index: number, info: TestInfo) {
  const target = page.getByTestId(`bottle-${index}`)
  if (info.project.name === 'mobile') await target.tap()
  else await target.click()
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
}
async function board(page: Page) {
  return page.locator('[data-liquid]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-liquid')))
}

test('select, reject invalid move, maximal pour, undo, and deselect', async ({ page }, info) => {
  await openGame(page)
  await expect(page.getByTestId('moves')).toHaveText('0')
  await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled()
  await bottle(page, 0, info)
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('aria-pressed', 'true')
  await bottle(page, 1, info)
  await expect(page.getByText('暂时不能倒入', { exact: false })).toBeVisible()
  expect(await board(page)).toEqual(initial.map((b) => b.join(',')))
  await expect(page.getByTestId('moves')).toHaveText('0')
  await bottle(page, 7, info)
  await expect(page.getByTestId('bottle-7')).toHaveAttribute('data-liquid', '4,4')
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('data-liquid', '4,6')
  await expect(page.getByTestId('moves')).toHaveText('1')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  expect(await board(page)).toEqual(initial.map((b) => b.join(',')))
  await bottle(page, 0, info)
  await bottle(page, 0, info)
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('aria-pressed', 'false')
  await bottle(page, 8, info)
  await expect(page.getByText('这是一只空瓶', { exact: false })).toBeVisible()
})

test('reload restores board, counter and undo history without retired color symbols', async ({ page }, info) => {
  await openGame(page)
  await bottle(page, 0, info)
  await bottle(page, 7, info)
  await page.getByRole('button', { name: '玩法说明' }).click()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await page.getByRole('button', { name: '关闭', exact: true }).click()
  const moved = await board(page)
  await page.reload()
  expect(await board(page)).toEqual(moved)
  await expect(page.getByTestId('moves')).toHaveText('1')
  await page.getByRole('button', { name: '玩法说明' }).click()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(page.locator('.bottle-art text')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  expect(await board(page)).toEqual(initial.map((b) => b.join(',')))
})

test('restart protects progress and restores the exact current puzzle', async ({ page }, info) => {
  await openGame(page)
  await bottle(page, 0, info)
  await bottle(page, 7, info)
  const moved = await board(page)
  await page.getByRole('button', { name: '重来', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '继续当前游戏' }).click()
  expect(await board(page)).toEqual(moved)
  await expect(page.getByRole('button', { name: '新谜题', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '重来', exact: true }).click()
  await page.getByRole('button', { name: '确认重来' }).click()
  expect(await board(page)).toEqual(initial.map((b) => b.join(',')))
  await expect(page.getByTestId('moves')).toHaveText('0')
})

test('plays a complete verified puzzle to victory, restores victory, and undoes it', async ({ page }, info) => {
  test.setTimeout(90_000)
  await openGame(page)
  for (const [from, to] of presets[0].solution) {
    await bottle(page, from, info)
    await bottle(page, to, info)
  }
  await expect(page.getByRole('dialog', { name: '调配完成' })).toBeVisible()
  await expect(page.getByTestId('total-completed')).toHaveText('1')
  await expect(page.getByTestId('moves')).toHaveText(String(presets[0].solution.length))
  await expect(page.getByTestId('bottle-0')).toBeDisabled()
  const finished = await board(page)
  expect(finished.filter((b) => b === '')).toHaveLength(2)
  for (const full of finished.filter(Boolean)) expect(new Set(full!.split(',')).size).toBe(1)
  await page.reload()
  await expect(page.getByRole('dialog', { name: '调配完成' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '新谜题', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByTestId('moves')).toHaveText(String(presets[0].solution.length - 1))
  const last = presets[0].solution.at(-1)!
  await bottle(page, last[0], info)
  await bottle(page, last[1], info)
  await expect(page.getByTestId('total-completed')).toHaveText('1')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: '新谜题', exact: true }).click()
  await expect(page.getByTestId('moves')).toHaveText('0')
})

test('narrow and wide layouts keep nine usable targets in three columns', async ({ page }, info) => {
  await openGame(page)
  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport)
    const layout = await page.locator('[data-liquid]').evaluateAll((nodes) => nodes.map((node) => {
      const r = node.getBoundingClientRect()
      return { x: Math.round(r.x), y: Math.round(r.y), width: r.width, height: r.height }
    }))
    expect(layout).toHaveLength(9)
    expect(new Set(layout.map((b) => b.x)).size).toBe(3)
    expect(new Set(layout.map((b) => b.y)).size).toBe(3)
    expect(layout.every((b) => b.width >= 44 && b.height >= 44)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (viewport.width === 390) {
      const controls = await page.locator('.controls').boundingBox()
      expect(controls!.y + controls!.height).toBeLessThanOrEqual(viewport.height)
    }
  }
  await page.setViewportSize(info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 900 })
  await page.screenshot({ path: info.outputPath('foundation.png'), fullPage: true })
})

test('help, keyboard controls, and reduced motion remain usable', async ({ page }) => {
  await openGame(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: '玩法说明' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByTestId('bottle-0').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('aria-pressed', 'true')
  expect(await page.locator('.bottle-art').first().evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('bottle-0')).toHaveAttribute('aria-pressed', 'false')
})

test('corrupt local data recovers to a valid puzzle without browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), saveKey)
  await page.goto('/')
  await expect(page.getByTestId('moves')).toHaveText('0')
  await expect(page.locator('[data-liquid]')).toHaveCount(9)
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), saveKey)
  expect(saved.version).toBe(3)
  expect(saved.session.board.flat().sort()).toEqual(initial.flat().sort())
  expect(errors).toEqual([])
})

test('blocked localStorage keeps the game playable and reports unsaved progress', async ({ page }, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } })
  })
  await page.goto('/')
  await expect(page.getByText('无法自动保存，请保持此页面打开')).toBeVisible()
  await bottle(page, 0, info)
  await bottle(page, 7, info)
  await expect(page.getByTestId('moves')).toHaveText('1')
})
