import { test, expect, type Page } from '@playwright/test'
import presets from '../src/game/presets.json' with { type: 'json' }
import { createSession, pourSession } from '../src/game/session'
import type { Board } from '../src/game/rules'

const key = 'moonlit-alchemy.save.v1', preset = presets[0]
async function open(page: Page, step = 0) {
  let session = createSession({ presetId: preset.id, initial: preset.board as Board })
  for (const [from, to] of preset.solution.slice(0, step)) session = pourSession(session, from, to)!.session
  await page.clock.install()
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  await page.addInitScript(({ key, session }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, session }))
  }, { key, session })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
}
const saved = (page: Page) => page.evaluate(key => localStorage.getItem(key), key)
const drawing = (page: Page) => page.locator('.board .bottle-art').evaluateAll(nodes => nodes.map(node => {
  const svg = node as SVGSVGElement, m = svg.getScreenCTM()!
  return { matrix: [m.a, m.b, m.c, m.d, m.e, m.f], level: svg.dataset.fillLevel,
    cavity: svg.querySelector('clipPath path')!.getAttribute('d'),
    liquid: svg.querySelector('.liquid-cavity')!.innerHTML }
}))

test('flat/soft/ambient only change glass, keep all nine and saves stable, and coexist with older parameters', async ({ page }) => {
  await open(page, 5)
  const state = await saved(page), geometry = await drawing(page)
  // useId values change on navigation; compare liquid DOM after normalizing its IDs.
  const normalize = (value: unknown) => JSON.stringify(value).replace(/_r_[a-z0-9]+/g, 'ID')
  for (const mode of ['flat', 'soft', 'ambient']) {
    await page.goto('/?lighting=' + mode)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.board .moon-glass-art')).toHaveCount(9)
    expect(await page.locator('.board .moon-glass-art').evaluateAll(nodes => nodes.map(el => el.getAttribute('data-lighting')))).toEqual(Array(9).fill(mode))
    await expect(page.locator('.board .glass-environment')).toHaveCount(mode === 'ambient' ? 9 : 0)
    await expect(page.getByTestId('bottle-0').locator('.moon-glass-texture')).toHaveAttribute('href', `/assets/bottles/star-moon-glass${mode === 'flat' ? '' : '-soft'}.webp`)
    expect(normalize(await drawing(page))).toBe(normalize(geometry))
    expect(await saved(page)).toBe(state)
    await expect(page.locator('.board .bottle-art[filter], .liquid-cavity[filter], .gravity-liquid[filter]')).toHaveCount(0)
    const lights = await page.locator('.board .moon-glass-art').evaluateAll(nodes => nodes.map(n => n.outerHTML))
    await page.clock.runFor(10_000)
    expect(await page.locator('.board .moon-glass-art').evaluateAll(nodes => nodes.map(n => n.outerHTML))).toEqual(lights)
  }
  await page.goto('/?lighting=ambient&glass=candle&liquid=unified&bottles=sample')
  await expect(page.locator('.board .moon-glass-art')).toHaveCount(1)
  await expect(page.locator('.board .moon-glass-art')).toHaveAttribute('data-finish', 'candle')
  await expect(page.locator('.board .glass-environment')).toHaveCount(0)
  expect(await page.locator('.board .bottle-art').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-liquid-finish')))).toEqual(Array(9).fill('unified'))
  expect(await saved(page)).toBe(state)
})

async function worldAnchorErrors(page: Page, selector: string) {
  return page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const svg = node as SVGSVGElement, m = svg.getScreenCTM()!
    const scene = document.querySelector('.cabinet-scene')!.getBoundingClientRect(), scale = scene.width / 841
    // Independent flame landmarks observed on the cabinet's first shelf sides.
    return [['left-candle', 16, 610], ['right-candle', 817, 574]].map(([id, x, y]) => {
      const gradient = svg.querySelector(`[data-world-light="${id}"]`) as SVGRadialGradientElement
      const actual = new DOMPoint(gradient.cx.baseVal.value, gradient.cy.baseVal.value).matrixTransform(m)
      return Math.hypot(actual.x - (scene.left + Number(x) * scale), actual.y - (scene.top + Number(y) * scale))
    })
  }))
}

test('world lights stay on cabinet landmarks through selection, source travel/tilt, receiving and return', async ({ page }) => {
  await open(page)
  for (let step = 0; step < 2; step++) {
    const [from, to] = preset.solution[step]
    await page.getByTestId('bottle-' + from).dispatchEvent('click')
    await page.clock.runFor(220)
    // JS clock advancement does not finish the compositor's existing CSS lift.
    await expect.poll(async () => Math.max(...(await worldAnchorErrors(page, `[data-testid="bottle-${from}"] .bottle-art`)).flat())).toBeLessThan(.15)
    await page.getByTestId('bottle-' + to).dispatchEvent('click')
    let elapsed = 0
    for (const time of [120, 320, 430, 446, 540, 790]) {
      await page.clock.runFor(time - elapsed); elapsed = time
      for (const error of (await worldAnchorErrors(page, '.flying-bottle .bottle-art, .receiving-sprite .bottle-art')).flat()) expect(error).toBeLessThan(.15)
      const sprites = page.locator('.flying-bottle .moon-glass-art, .receiving-sprite .moon-glass-art')
      expect(await sprites.evaluateAll(nodes => nodes.map(n => n.getAttribute('data-lighting')))).toEqual(['ambient', 'ambient'])
    }
    await page.clock.runFor(250)
    await expect(page.getByTestId('pour-animation')).toHaveCount(0)
    expect((await worldAnchorErrors(page, '.board .bottle-art')).flat().every(error => error < .15)).toBe(true)
  }
  await page.getByRole('button', { name: '撤销', exact: true }).dispatchEvent('click')
  const state = await saved(page)
  await page.reload()
  expect(await saved(page)).toBe(state)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const [from, to] = preset.solution[1]
  await page.getByTestId('bottle-' + from).dispatchEvent('click')
  await page.getByTestId('bottle-' + to).dispatchEvent('click')
  await expect(page.getByTestId('pour-animation')).toHaveCount(0)
  await expect(page.getByTestId('moves')).toHaveText('2')
})
