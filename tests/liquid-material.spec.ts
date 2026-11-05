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
  for (const [url, finish] of [['/?liquid=legacy', 'legacy'], ['/?liquid=polished', 'polished'], ['/?liquid=unified', 'unified'], ['/?liquid=clean', 'clean'], ['/?liquid=soft-translucent', 'soft-translucent'], ['/?liquid=gem-luster', 'gem-luster'], ['/?liquid=vivid-translucent', 'vivid-translucent'], ['/?liquid=luminous-liquid', 'luminous-liquid'], ['/?liquid=material-a', 'material-a'], ['/?liquid=material-b', 'material-b'], ['/', 'material-a']]) {
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
    await expect(occupied.locator('.liquid-lighting')).toHaveCount((finish === 'legacy' || finish === 'polished') ? 0 : 1)
  }
})

for (const finish of ['clean', 'soft-translucent', 'gem-luster', 'vivid-translucent', 'luminous-liquid', 'material-a', 'material-b']) test(`${finish} stays consistent in source and receiving sprites, preserves gravity, then undoes and restores`, async ({ page }) => {
  await open(page, 0, true)
  await page.goto('/?liquid=' + finish)
  for (let step = 0; step < 2; step++) {
    const [from, to] = preset.solution[step]
    await page.getByTestId(`bottle-${from}`).dispatchEvent('click')
    await page.clock.runFor(200)
    await page.getByTestId(`bottle-${to}`).dispatchEvent('click')
    await page.clock.runFor(430)
    await expect(page.getByTestId('pour-animation')).toHaveAttribute('data-phase', 'pour')
    for (const sprite of ['.flying-bottle', '.receiving-sprite']) {
      await expect(page.locator(`${sprite} .bottle-art`)).toHaveAttribute('data-liquid-finish', finish)
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
  await expect(page.getByTestId('bottle-0').locator('.bottle-art')).toHaveAttribute('data-liquid-finish', finish)
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
  await page.goto('/?liquid=clean')
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

test('candidate materials share unchanged unit geometry and palette, with one wet material field and quieter identical seams', async ({ page }) => {
  await open(page, 0, true)
  const saved = await read(page)
  const mainColors = ['#ce4778', '#9858d2', '#43b99b', '#399bd9', '#e3a83d', '#eb915c', '#d174cd']
  const cases = [[], [1], [1,1], [1,1,1], [1,1,1,1], [1,4,1,4], [1,1,4,4]]
  const reference: unknown[] = []
  for (const finish of ['clean', 'soft-translucent', 'gem-luster']) {
    await page.goto('/?liquid=' + finish)
    let opticalField: unknown
    const palette = await page.locator('.board .liquid-layer').evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.getAttribute('data-color'), n.querySelector('rect')!.getAttribute('fill')])))
    expect(palette).toEqual(Object.fromEntries(mainColors.map((color, id) => [id, color])))
    for (const [caseIndex, liquid] of cases.entries()) {
      await page.evaluate(async liquid => {
        const path = '/tests/fixtures/liquidPreview.tsx'
        const { renderLiquidFixture } = await import(path)
        renderLiquidFixture(liquid)
      }, liquid)
      const art = page.locator('[data-liquid-fixture] .bottle-art')
      await expect(art).toHaveAttribute('data-fill-level', String(liquid.length))
      await expect.poll(() => art.locator('.liquid-layer').evaluateAll(nodes => nodes.map(n => Number(n.getAttribute('data-color'))))).toEqual(liquid)
      const geometry = await art.evaluate((svg: SVGSVGElement) => ({
        levels: [...svg.querySelectorAll<SVGRectElement>('.liquid-layer > rect')].map(r => [r.y.baseVal.value, r.height.baseVal.value]),
        seams: [...svg.querySelectorAll<SVGPathElement>('.liquid-boundary')].map(p => p.getPointAtLength(0).y),
      }))
      if (finish === 'clean') reference[caseIndex] = geometry
      else expect(geometry).toEqual(reference[caseIndex])
      await expect(art.locator('.liquid-boundary')).toHaveCount(Math.max(0, liquid.length - 1))
      await expect(art.locator('.liquid-surface')).toHaveCount(liquid.length ? 1 : 0)
      await expect(art.locator('.liquid-lighting')).toHaveCount(liquid.length ? 1 : 0)
      if (finish !== 'clean' && liquid.length) {
        const material = await art.evaluate((svg: SVGSVGElement) => {
          const light = svg.querySelector('.liquid-lighting')!
          const clip = svg.querySelector(light.getAttribute('clip-path')!.slice(4, -1))!
          return {
            wetY: clip.querySelector<SVGRectElement>('rect')!.y.baseVal.value,
            topY: svg.querySelector<SVGPathElement>('.liquid-surface')!.getPointAtLength(0).y,
            perLayerGradients: svg.querySelectorAll('.liquid-layer linearGradient, .liquid-layer radialGradient, .liquid-layer filter').length,
            fields: [...light.querySelectorAll('path')].map(p => svg.querySelector(p.getAttribute('fill')!.slice(4, -1))!.outerHTML),
            fills: [...svg.querySelectorAll('.liquid-layer > rect')].map(r => r.getAttribute('fill')),
            seams: [...svg.querySelectorAll('.liquid-boundary')].map(p => ({
              width: Number(p.getAttribute('stroke-width')),
              stops: [...svg.querySelector(p.getAttribute('stroke')!.slice(4, -1))!.children].map(s => [s.getAttribute('stop-color'), Number(s.getAttribute('stop-opacity'))]),
            })),
          }
        })
        expect(material.wetY).toBeCloseTo(material.topY, 4)
        expect(material.perLayerGradients).toBe(0)
        if (opticalField === undefined) opticalField = material.fields
        else expect(material.fields).toEqual(opticalField)
        expect(material.fills).toEqual(liquid.map(color => mainColors[color]))
        for (const seam of material.seams) {
          expect(seam.width).toBeGreaterThanOrEqual(.6)
          expect(seam.width).toBeLessThanOrEqual(.7)
          expect(seam.stops.every(([color]) => color === '#544d47')).toBe(true)
          const peak = Math.max(...seam.stops.map(([, opacity]) => Number(opacity)))
          expect(peak).toBeGreaterThanOrEqual(.25)
          expect(peak).toBeLessThanOrEqual(.3)
          expect(seam.stops).toEqual(material.seams[0].stops)
        }
      }
      expect(await read(page)).toEqual(saved)
    }
    const still = await page.locator('[data-liquid-fixture] .bottle-art').evaluate(el => el.outerHTML)
    await page.clock.runFor(10_000)
    expect(await page.locator('[data-liquid-fixture] .bottle-art').evaluate(el => el.outerHTML)).toBe(still)
  }
})

test('vivid keeps unit planes and color identities while transmitting through one fixed field with finer seams', async ({ page }) => {
  await open(page, 0, true)
  const saved = await read(page)
  const colors = ['#f35d93', '#af62ff', '#51dcb6', '#30c3ff', '#ffd04a', '#ffb361', '#f18af8']
  const names = ['玫瑰红', '紫水晶', '薄荷绿', '天空蓝', '蜂蜜金', '珊瑚橙', '兰花粉']
  const cases = [[], [1], [1,1], [1,1,1], [1,1,1,1], [1,1,4,4], [1,4,1,4]]
  const geometry: unknown[] = []
  let field: unknown
  for (const finish of ['gem-luster', 'vivid-translucent']) {
    await page.goto('/?liquid=' + finish)
    if (finish === 'vivid-translucent') {
      const palette = await page.locator('.board .liquid-layer').evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.getAttribute('data-color'), n.querySelector('rect')!.getAttribute('fill')])))
      expect(palette).toEqual(Object.fromEntries(colors.map((color, i) => [i, color])))
      for (const name of names) expect((await page.locator('.board').innerHTML()).includes(name)).toBe(true)
    }
    for (const [caseIndex, liquid] of cases.entries()) {
      await page.evaluate(async liquid => {
        const path = '/tests/fixtures/liquidPreview.tsx'
        const { renderLiquidFixture } = await import(path)
        renderLiquidFixture(liquid)
      }, liquid)
      const art = page.locator('[data-liquid-fixture] .bottle-art')
      await expect.poll(() => art.locator('.liquid-layer').evaluateAll(nodes => nodes.map(n => Number(n.getAttribute('data-color'))))).toEqual(liquid)
      const drawing = await art.evaluate((svg: SVGSVGElement) => ({
        units: [...svg.querySelectorAll<SVGRectElement>('.liquid-layer > rect')].map(r => [r.y.baseVal.value, r.height.baseVal.value]),
        seams: [...svg.querySelectorAll<SVGPathElement>('.liquid-boundary')].map(p => p.getAttribute('d')),
      }))
      if (finish === 'gem-luster') geometry[caseIndex] = drawing
      else {
        expect(drawing).toEqual(geometry[caseIndex])
        await expect(art.locator('.liquid-surface')).toHaveCount(liquid.length ? 1 : 0)
        await expect(art.locator('.liquid-transmission')).toHaveCount(liquid.length ? 1 : 0)
        await expect(art.locator('.liquid-boundary')).toHaveCount(Math.max(0, liquid.length - 1))
        if (liquid.length) {
          const optical = await art.evaluate((svg: SVGSVGElement) => {
            const body = svg.querySelector('.liquid-transmission')!, mask = svg.querySelector(body.getAttribute('mask')!.slice(4, -1))!
            const path = mask.querySelector('path')!, gradient = svg.querySelector(path.getAttribute('fill')!.slice(4, -1))!
            return { field: gradient.outerHTML, maskType: (mask as SVGMaskElement).style.maskType,
              cavity: path.getAttribute('d'), originalCavity: svg.querySelector('clipPath path')!.getAttribute('d'),
              alpha: [...gradient.children].map(s => Number(s.getAttribute('stop-opacity'))),
              seams: [...svg.querySelectorAll('.liquid-boundary')].map(p => ({ width: Number(p.getAttribute('stroke-width')),
                colors: [...svg.querySelector(p.getAttribute('stroke')!.slice(4, -1))!.children].map(s => s.getAttribute('stop-color')),
                peak: Math.max(...[...svg.querySelector(p.getAttribute('stroke')!.slice(4, -1))!.children].map(s => Number(s.getAttribute('stop-opacity')))) })),
              colorMasks: svg.querySelectorAll('.liquid-layer[mask]').length }
          })
          if (field === undefined) field = optical.field
          else expect(optical.field).toBe(field)
          expect(optical.maskType).toBe('alpha')
          expect(optical.cavity).toBe(optical.originalCavity)
          expect(Math.max(...optical.alpha)).toBeLessThanOrEqual(.8)
          expect(Math.min(...optical.alpha)).toBeGreaterThan(.55)
          expect(Math.min(...optical.alpha)).toBeLessThan(.65)
          expect(optical.colorMasks).toBe(0)
          for (const seam of optical.seams) {
            expect(seam.width).toBeGreaterThan(.3)
            expect(seam.width).toBeLessThan(.4)
            expect(seam.peak).toBeGreaterThan(.1)
            expect(seam.peak).toBeLessThanOrEqual(.2)
            expect(seam.colors.every(color => color === '#544d47')).toBe(true)
          }
        }
      }
      expect(await read(page)).toEqual(saved)
    }
  }
  const drawing = await page.locator('[data-liquid-fixture] .bottle-art').evaluate(el => el.outerHTML)
  await page.clock.runFor(10_000)
  expect(await page.locator('[data-liquid-fixture] .bottle-art').evaluate(el => el.outerHTML)).toBe(drawing)
})

test('internal-light liquid keeps equal units, suppresses same-color dividers and prevents background leaks at interfaces', async ({ page }) => {
  await open(page, 0, true)
  const state = await read(page), cases = [[], [3], [1,1,1,1], [1,3], [1,1,4], [1,1,4,4], [1,3,4,0]]
  const reference: unknown[] = [], backgroundChange: number[] = []
  let fixedField: unknown
  for (const mode of ['vivid-translucent', 'luminous-liquid']) {
    await page.goto('/?liquid=' + mode)
    await page.evaluate(() => document.fonts.ready)
    for (const [caseIndex, liquid] of cases.entries()) {
      await page.evaluate(async liquid => {
        const path = '/tests/fixtures/liquidPreview.tsx'
        const { renderLiquidFixture } = await import(path)
        renderLiquidFixture(liquid)
      }, liquid)
      const art = page.locator('[data-liquid-fixture] .bottle-art')
      await expect.poll(() => art.locator('.liquid-layer').evaluateAll(nodes => nodes.map(n => Number(n.getAttribute('data-color'))))).toEqual(liquid)
      const units = await art.locator('.liquid-layer').evaluateAll(nodes => nodes.map(el => {
        const r = el.querySelector('rect') as SVGRectElement
        if (el.hasAttribute('data-upper-plane')) {
          const upper = Number(el.getAttribute('data-upper-plane')), lower = Number(el.getAttribute('data-lower-plane'))
          return [upper, lower - upper + .03]
        }
        return [r.y.baseVal.value, r.height.baseVal.value]
      }))
      if (mode === 'vivid-translucent') reference[caseIndex] = units
      else {
        // SVG baseVal is float32 while plane attributes are doubles.
        const expected = reference[caseIndex] as number[][]
        expect(units).toHaveLength(expected.length)
        units.forEach((unit, i) => unit.forEach((v, j) => expect(v).toBeCloseTo(expected[i][j], 4)))
        const painted = await art.locator('.liquid-layer').evaluateAll(nodes => nodes.slice(1).map(el => {
          const r = el.querySelector('rect') as SVGRectElement
          return [r.y.baseVal.value + r.height.baseVal.value, Number(el.getAttribute('data-lower-plane'))]
        }))
        // Real painted lower edges, not only metadata, must stay on unit planes.
        for (const [edge, plane] of painted) expect(edge).toBeCloseTo(plane, 4)
        const changes = liquid.flatMap((c, i) => i && c !== liquid[i - 1] ? [String(i)] : [])
        expect(await art.locator('.liquid-boundary').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-unit')))).toEqual(changes)
        await expect(art.locator('.liquid-surface')).toHaveCount(liquid.length ? 1 : 0)
        await expect(art.locator('.liquid-body')).toHaveCount(liquid.length ? 1 : 0)
        if (liquid.length) {
          await expect(art.locator('.liquid-body')).toHaveAttribute('opacity', '.98')
          const field = await art.locator('.liquid-inner-light, .liquid-inner-depth').evaluateAll(nodes => nodes.map(n => {
            const svg = (n as SVGElement).ownerSVGElement!, mask = svg.querySelector(n.getAttribute('mask')!.slice(4, -1))!
            return svg.querySelector(mask.querySelector('path')!.getAttribute('fill')!.slice(4, -1))!.outerHTML
          }))
          if (fixedField === undefined) fixedField = field
          else expect(field).toEqual(fixedField)
          const seam = await art.locator('.liquid-boundary').evaluateAll(nodes => nodes.map(n => ({
            width: Number(n.getAttribute('stroke-width')),
            peak: Math.max(...[...(n as SVGElement).ownerSVGElement!.querySelector(n.getAttribute('stroke')!.slice(4, -1))!.children].map(s => Number(s.getAttribute('stop-opacity')))),
          })))
          for (const line of seam) { expect(line.width).toBeLessThan(.25); expect(line.peak).toBeLessThanOrEqual(.12) }
        }
      }
      expect(await read(page)).toEqual(state)
    }
    const art = page.locator('[data-liquid-fixture] .bottle-art')
    const samples = await art.evaluate((svg: SVGSVGElement) => {
      const layers = [...svg.querySelectorAll('.liquid-layer')], matrix = svg.getScreenCTM()!
      const planes = layers.map(el => {
        const r = el.querySelector('rect') as SVGRectElement
        return el.hasAttribute('data-upper-plane') ? [Number(el.getAttribute('data-upper-plane')), Number(el.getAttribute('data-lower-plane'))] : [r.y.baseVal.value, r.y.baseVal.value + r.height.baseVal.value - .03]
      })
      const ys = [...planes.map(([upper, lower]) => (upper + lower) / 2), ...planes.slice(0, -1).map(([upper]) => upper)]
      return ys.map(y => { const p = new DOMPoint(50, y).matrixTransform(matrix); return [Math.floor(p.x), Math.floor(p.y)] })
    })
    const captures: number[][] = []
    // Readonly diagnostic underlay: extreme contrast behind actual browser-rendered
    // liquid must barely affect luminous centers AND boundaries. Never saved/shipped.
    for (const fill of ['black', 'white']) {
      await art.evaluate((svg: SVGSVGElement, fill) => {
        let rect = svg.querySelector('[data-background-probe]')
        if (!rect) {
          rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
          rect.setAttribute('data-background-probe', '')
          for (const [key, value] of Object.entries({ x: '-160', y: '-160', width: '420', height: '420' })) rect.setAttribute(key, value)
          const cavity = svg.querySelector('.liquid-cavity')!; cavity.insertBefore(rect, cavity.firstChild)
        }
        rect.setAttribute('fill', fill)
      }, fill)
      const screenshot = await page.screenshot({ scale: 'css' })
      captures.push(await page.evaluate(async ({ png, samples }) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode()
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height
        const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0)
        return samples.flatMap(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data].slice(0, 3))
      }, { png: screenshot.toString('base64'), samples }))
    }
    backgroundChange.push(Math.max(...captures[0].map((v, i) => Math.abs(v - captures[1][i]))))
    await art.locator('[data-background-probe]').evaluate(el => el.remove())
    expect(await read(page)).toEqual(state)
  }
  expect(backgroundChange[0]).toBeGreaterThan(35)
  expect(backgroundChange[1]).toBeLessThanOrEqual(7)
  const still = await page.locator('[data-liquid-fixture] .bottle-art').evaluate(el => el.outerHTML)
  await page.clock.runFor(10_000)
  expect(await page.locator('[data-liquid-fixture] .bottle-art').evaluate(el => el.outerHTML)).toBe(still)
})

test('material A/B preserve equal planes, visible weaker same-color cues and stable covered volume with distinct light', async ({ page }) => {
  await open(page, 0, true)
  const saved = await read(page), cases = [[], [1], [1,1], [1,1,1], [1,1,1,1], [1,3,4,0], [1,1,4,4]]
  const reference: number[][][] = [], shades: number[][] = []
  for (const mode of ['luminous-liquid', 'material-a', 'material-b']) {
    await page.goto('/?liquid=' + mode)
    let fields: unknown
    for (const [index, liquid] of cases.entries()) {
      await page.evaluate(async liquid => {
        const path = '/tests/fixtures/liquidPreview.tsx'
        const { renderLiquidFixture } = await import(path)
        renderLiquidFixture(liquid)
      }, liquid)
      const art = page.locator('[data-liquid-fixture] .bottle-art')
      await expect(art.locator('.liquid-layer')).toHaveCount(liquid.length)
      const planes = await art.locator('.liquid-layer').evaluateAll(nodes => nodes.map(n => [Number(n.getAttribute('data-upper-plane')), Number(n.getAttribute('data-lower-plane'))]))
      if (mode === 'luminous-liquid') { reference[index] = planes; continue }
      expect(planes).toEqual(reference[index])
      // Actual overpaint edges must meet the original logical unit planes.
      const edges = await art.locator('.liquid-layer').evaluateAll(nodes => nodes.slice(1).map(n => {
        const r = n.querySelector('rect') as SVGRectElement
        return [r.y.baseVal.value + r.height.baseVal.value, Number(n.getAttribute('data-lower-plane'))]
      }))
      for (const [edge, plane] of edges) expect(edge).toBeCloseTo(plane, 4)
      if (planes.length === 4) for (const [upper, lower] of planes) expect(lower - upper).toBeCloseTo(planes[0][1] - planes[0][0], 10)
      const boundaries = await art.locator('.liquid-boundary').evaluateAll(nodes => nodes.map(n => {
        return { unit: Number(n.getAttribute('data-unit')), type: n.getAttribute('data-boundary'), y: (n as SVGPathElement).getPointAtLength(0).y,
          width: Number(n.getAttribute('stroke-width')), peak: Number(n.getAttribute('stroke-opacity')) }
      }))
      expect(boundaries.map(b => [b.unit, b.type])).toEqual(liquid.slice(1).map((c, i) => [i + 1, c === liquid[i] ? 'unit' : 'color']))
      // SVG path samples are float32; the unchanged logical planes are doubles.
      for (const b of boundaries) { expect(b.y).toBeCloseTo(planes[b.unit][1], 4); expect(b.width).toBeLessThan(.8) }
      const unit = boundaries.find(b => b.type === 'unit'), color = boundaries.find(b => b.type === 'color')
      if (unit && color) { expect(unit.peak).toBeLessThan(color.peak); expect(unit.peak).toBeGreaterThan(0) }
      await expect(art.locator('.liquid-surface')).toHaveCount(liquid.length ? 1 : 0)
      await expect(art.locator('.liquid-lighting')).toHaveCount(liquid.length ? 1 : 0)
      if (liquid.length) {
        const current = await art.locator('.liquid-lighting > g').evaluateAll(nodes => nodes.map(n => (n as SVGElement).ownerSVGElement!.querySelector(n.getAttribute('mask')!.slice(4, -1))!.outerHTML))
        if (fields === undefined) fields = current
        else expect(current).toEqual(fields)
      }
      expect(await read(page)).toEqual(saved)
    }
    if (mode === 'luminous-liquid') continue
    // Raster checks use a same-color full bottle, not just DOM/style assertions.
    await page.evaluate(async () => {
      const path = '/tests/fixtures/liquidPreview.tsx'
      const { renderLiquidFixture } = await import(path)
      renderLiquidFixture([1,1,1,1])
    })
    const art = page.locator('[data-liquid-fixture] .bottle-art')
    await expect(art.locator('[data-boundary="unit"]')).toHaveCount(3)
    const probes = await art.evaluate((svg: SVGSVGElement) => {
      const m = svg.getScreenCTM()!, point = (x: number, y: number) => { const p = new DOMPoint(x, y).matrixTransform(m); return [p.x, p.y] }
      const planes = [...svg.querySelectorAll('.liquid-layer')].map(n => [Number(n.getAttribute('data-upper-plane')), Number(n.getAttribute('data-lower-plane'))])
      return { centers: planes.map(([a, b]) => point(50, (a + b) / 2)), seams: planes.slice(1).map(([, b]) => point(50, b)),
        light: [[33,100],[46,98],[65,100],[50,115]].map(([x,y]) => point(x,y)) }
    })
    const pixels = async () => {
      const png = (await page.screenshot({ scale: 'css' })).toString('base64')
      return page.evaluate(async ({ png, probes }) => {
        const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode()
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
        const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0)
        const rgb = ([x, y]: number[]) => [...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data].slice(0, 3)
        const luma = (x: number, y: number) => rgb([x, y]).reduce((sum, c) => sum + c, 0) / 3
        return { coverage: [...probes.centers, ...probes.seams].flatMap(rgb), light: probes.light.flatMap(rgb),
          contrast: probes.seams.map(([x, y]) => Math.max(...[-1,0,1].map(d => {
            const row = Math.floor(y) + d
            return (luma(x, row - 2) + luma(x, row + 2)) / 2 - luma(x, row)
          }))) }
      }, { png, probes })
    }
    const normal = await pixels(); shades.push(normal.light)
    for (const contrast of normal.contrast) { expect(contrast).toBeGreaterThan(1.5); expect(contrast).toBeLessThan(20) }
    const backgrounds: number[][] = []
    for (const fill of ['black', 'white']) {
      await art.evaluate((svg: SVGSVGElement, fill) => {
        let rect = svg.querySelector('[data-background-probe]')
        if (!rect) {
          rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); rect.setAttribute('data-background-probe', '')
          for (const [k, v] of Object.entries({x:'-160',y:'-160',width:'420',height:'420'})) rect.setAttribute(k,v)
          const cavity = svg.querySelector('.liquid-cavity')!; cavity.insertBefore(rect, cavity.firstChild)
        }
        rect.setAttribute('fill', fill)
      }, fill)
      backgrounds.push((await pixels()).coverage)
    }
    expect(Math.max(...backgrounds[0].map((v, i) => Math.abs(v - backgrounds[1][i])))).toBeLessThanOrEqual(5)
    await art.locator('[data-background-probe]').evaluate(n => n.remove())
    expect(await read(page)).toEqual(saved)
    const still = await art.evaluate(n => n.outerHTML)
    await page.clock.runFor(10_000)
    expect(await art.evaluate(n => n.outerHTML)).toBe(still)
  }
  expect(Math.max(...shades[0].map((v, i) => Math.abs(v - shades[1][i])))).toBeGreaterThan(8)
})
