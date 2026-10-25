import { describe, expect, it } from 'vitest'
import { BOTTLE_GEOMETRY, MOUTH, area, below, liquidSurfaces, pouringAngle, rotate, bottleAppearance, type BottleAppearance } from './bottleGeometry'

it('clips a known rectangle by a gravity plane, including empty/full boundaries', () => {
  const box = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 20 }, { x: 0, y: 20 }]
  expect(area(box)).toBe(200)
  expect(area(below(box, 12))).toBe(80)
  expect(area(below(box, -1))).toBe(200)
  expect(area(below(box, 21))).toBe(0)
})
for (const kind of ['round', 'pear', 'faceted', 'moon-glass'] as BottleAppearance[]) describe(kind, () => {
  const shape = BOTTLE_GEOMETRY[kind]
  it('keeps four legible layers below the long neck, including empty and fractional fills', () => {
    const surfaces = liquidSurfaces(kind, 0, [0, 1, 2, 3, 4])
    if (kind === 'moon-glass') expect(surfaces[0]).toBeCloseTo(126.51, 1)
    else expect(surfaces[0]).toBe(131)
    expect(surfaces[4]).toBeGreaterThan(65)
    for (let i = 0; i < 4; i++) expect(surfaces[i] - surfaces[i + 1]).toBeGreaterThan(8)
    expect(liquidSurfaces(kind, 0, [2.5])[0]).toBeGreaterThan(surfaces[3])
    expect(liquidSurfaces(kind, 0, [2.5])[0]).toBeLessThan(surfaces[2])
  })
  it('conserves liquid area and layer order under left/right tilt and return', () => {
    for (const angle of [-140, -100, -45, 0, 45, 100, 140]) {
      const polygon = shape.polygon.map(p => rotate(p, angle))
      const levels = [0, .25, 1, 1.5, 2, 3, 4]
      const surfaces = liquidSurfaces(kind, angle, levels)
      for (let i = 0; i < levels.length; i++) {
        expect(area(below(polygon, surfaces[i])) / shape.capacityArea * 4).toBeCloseTo(levels[i], 4)
        if (i) expect(surfaces[i]).toBeLessThan(surfaces[i - 1])
      }
    }
  })
  it('increases tilt as volume drains, keeping the free surface at the actual downhill lip', () => {
    let previous = 0
    for (const level of [4, 3, 2, 1, .1]) {
      const angle = pouringAngle(kind, level)
      expect(angle).toBeGreaterThan(previous)
      expect(angle).toBeLessThan(175)
      for (const sign of [-1, 1]) {
        const lip = rotate({ x: MOUTH.x + sign * shape.mouthRadius, y: MOUTH.y }, sign * angle)
        expect(liquidSurfaces(kind, sign * angle, [level])[0]).toBeCloseTo(lip.y, 2)
      }
      previous = angle
    }
  })
})

it('only slot zero selects the formal art, including other round slots', () => {
  expect(Array.from({ length: 9 }, (_, i) => bottleAppearance(i))).toEqual([
    'moon-glass', 'pear', 'faceted', 'round', 'pear', 'faceted', 'round', 'pear', 'faceted',
  ])
})
