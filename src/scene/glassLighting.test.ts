import { expect, it } from 'vitest'
import { localLight, restGlassPose, screenGlassPose } from './glassLighting'

it('maps fixed cabinet lights through the inverse moving mouth-pivot transform', () => {
  for (const angle of [-140, -45, 0, 45, 140]) {
    const pose = { x: 120, y: 750, scale: 1.921, angle }
    for (const light of [{ x: 18, y: 622 }, { x: 806, y: 430 }, { x: 326, y: 40 }]) {
      const local = localLight(light, pose), r = angle * Math.PI / 180
      const x = (local.x - 50) * Math.cos(r) - (local.y - 10) * Math.sin(r) + 50
      const y = (local.x - 50) * Math.sin(r) + (local.y - 10) * Math.cos(r) + 10
      expect(pose.x + x * pose.scale).toBeCloseTo(light.x, 9)
      expect(pose.y + y * pose.scale).toBeCloseTo(light.y, 9)
    }
  }
})

it('uses the accepted scale and artwork feet at rest, independent of viewport pixels', () => {
  for (let index = 0; index < 9; index++) {
    const pose = restGlassPose(index)
    expect(pose.scale).toBeCloseTo(1.921, 10)
    expect(pose.x + 50 * pose.scale).toBe([250, 420.5, 591][index % 3])
    expect(pose.y + 134 * pose.scale).toBe([668, 1088, 1500][Math.floor(index / 3)])
    for (const width of [280, 378, 480]) {
      const ratio = width / 841, scene = { left: 30, top: 12, width }
      const measured = screenGlassPose(30 + pose.x * ratio, 12 + pose.y * ratio, pose.scale * 100 * ratio, 0, scene)
      expect(measured.x).toBeCloseTo(pose.x, 9)
      expect(measured.y).toBeCloseTo(pose.y, 9)
      expect(measured.scale).toBeCloseTo(pose.scale, 9)
    }
  }
})
