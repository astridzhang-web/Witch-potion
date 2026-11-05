import { GLASS_FINISH, MOON_GLASS } from './moonGlass'
import { STAR_MOON_GLASS } from './starMoonGlass'
import { LIQUID_FINISH } from './liquidAppearance'
import { usesFormalBottle } from './bottlePresentation'

/** Presentation geometry only; the four-unit game state remains in game/rules. */
export type BottleKind = 'round' | 'pear' | 'faceted'
export type BottleAppearance = BottleKind | 'moon-glass'
export interface Point { x: number; y: number }
export const MOUTH = { x: 50, y: 10, radius: 7 }
export const CONTACT = { x: 50, y: 134 }
const kinds: BottleKind[] = ['round', 'pear', 'faceted']
export const bottleKind = (index: number) => kinds[index % kinds.length]
// Resting and both flying sprites share this same presentation choice.
export const bottleAppearance = (index: number): BottleAppearance => usesFormalBottle(index) ? 'moon-glass' : bottleKind(index)

// Curves are sampled once. The same cavity polygon drives clipping AND liquid area.
function curve(points: Point[], end: Point, a: Point, b: Point) {
  const start = points.at(-1)!
  for (let i = 1; i <= 16; i++) {
    const t = i / 16, u = 1 - t
    points.push({ x: u ** 3 * start.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t ** 3 * end.x,
      y: u ** 3 * start.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t ** 3 * end.y })
  }
}
function cavity(kind: BottleKind): Point[] {
  const left: Point[] = [{ x: 45, y: 10 }, { x: 45, y: 47 }]
  if (kind === 'faceted') left.push({ x: 34, y: 67 }, { x: 22, y: 100 }, { x: 34, y: 125 }, { x: 42, y: 131 }, { x: 50, y: 131 })
  else {
    curve(left, { x: kind === 'round' ? 17 : 23, y: 99 }, { x: 45, y: 61 }, { x: kind === 'round' ? 17 : 30, y: kind === 'round' ? 62 : 75 })
    curve(left, { x: 50, y: 131 }, { x: 17, y: 120 }, { x: 33, y: 131 })
  }
  return [...left, ...left.slice(0, -1).reverse().map(p => ({ x: 100 - p.x, y: p.y }))]
}
export function area(points: readonly Point[]) {
  return Math.abs(points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p.x * q.y - q.x * p.y }, 0)) / 2
}
export function below(points: readonly Point[], y: number): Point[] {
  const result: Point[] = []
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[(i + 1) % points.length]
    if (p.y >= y) result.push(p)
    if ((p.y >= y) !== (q.y >= y)) {
      const t = (y - p.y) / (q.y - p.y)
      result.push({ x: p.x + (q.x - p.x) * t, y })
    }
  }
  return result
}
export function rotate(p: Point, angle: number): Point {
  const r = angle * Math.PI / 180, x = p.x - MOUTH.x, y = p.y - MOUTH.y
  return { x: MOUTH.x + x * Math.cos(r) - y * Math.sin(r), y: MOUTH.y + x * Math.sin(r) + y * Math.cos(r) }
}
const paths = {
  round: 'M42 10V47C42 59 14 62 14 99C14 122 31 134 50 134C69 134 86 122 86 99C86 62 58 59 58 47V10Z',
  pear: 'M42 10V45C42 61 27 74 20 99C13 122 31 134 50 134C69 134 87 122 80 99C73 74 58 61 58 45V10Z',
  faceted: 'M42 10V47L31 65L19 100L31 127L40 134H60L69 127L81 100L69 65L58 47V10Z',
}
function moonCavity(): Point[] {
  const left = [{ x: 430, y: 52 }, { x: 478, y: 98 }, { x: 486, y: 190 }, { x: 486, y: 500 }]
  curve(left, { x: 430, y: 715 }, { x: 486, y: 635 }, { x: 465, y: 685 })
  curve(left, { x: 222, y: 1020 }, { x: 310, y: 755 }, { x: 222, y: 856 })
  curve(left, { x: 360, y: 1300 }, { x: 222, y: 1140 }, { x: 266, y: 1250 })
  curve(left, { x: 543, y: 1328 }, { x: 414, y: 1326 }, { x: 480, y: 1328 })
  return [...left, ...left.slice(0, -1).reverse().map(p => ({ x: 1086 - p.x, y: p.y }))]
    .map(p => ({ x: 50 + (p.x - 543) * MOON_GLASS.scale, y: 10 + (p.y - 52) * MOON_GLASS.scale }))
}
function starMoonCavity(): Point[] {
  const left = [{ x: 374, y: 143 }, { x: 432, y: 215 }, { x: 439, y: 300 }, { x: 439, y: 560 }]
  curve(left, { x: 355, y: 775 }, { x: 435, y: 700 }, { x: 410, y: 731 })
  curve(left, { x: 171, y: 1077 }, { x: 228, y: 847 }, { x: 171, y: 969 })
  curve(left, { x: 308, y: 1305 }, { x: 171, y: 1174 }, { x: 235, y: 1270 })
  curve(left, { x: 512, y: 1335 }, { x: 365, y: 1333 }, { x: 443, y: 1335 })
  return [...left, ...left.slice(0, -1).reverse().map(p => ({ x: 1024 - p.x, y: p.y }))]
    .map(p => ({ x: 50 + (p.x - 512) * STAR_MOON_GLASS.scale, y: 10 + (p.y - 143) * STAR_MOON_GLASS.scale }))
}
interface Geometry { outline?: string; polygon: Point[]; clip: string; capacityArea: number; mouthRadius: number; floorY: number; fullY: number }
const geometry = (polygon: Point[], fullY: number, mouthRadius: number, outline?: string): Geometry => ({
  outline, polygon, clip: `M${polygon.map(p => `${p.x},${p.y}`).join('L')}Z`,
  capacityArea: area(below(polygon, fullY)), mouthRadius, floorY: Math.max(...polygon.map(p => p.y)), fullY,
})
export const BOTTLE_GEOMETRY: Record<BottleAppearance, Geometry> = {
  ...Object.fromEntries(kinds.map(kind => [kind, geometry(cavity(kind), kind === 'faceted' ? 72 : 76, MOUTH.radius, paths[kind])])) as Record<BottleKind, Geometry>,
  'moon-glass': GLASS_FINISH === 'star-moon'
    ? geometry(starMoonCavity(), 10 + (STAR_MOON_GLASS.fullY - 143) * STAR_MOON_GLASS.scale, STAR_MOON_GLASS.mouthRadius)
    : geometry(moonCavity(), 10 + (815 - 52) * MOON_GLASS.scale, 10.3),
}

/** Clean mode gives equal upright height to each logical unit. Reference areas are
 * measured at those upright planes, then conserved while tilting (not equal physical
 * volume per game unit). Both the plane solve and downhill-lip solve use this mapping. */
export function liquidArea(kind: BottleAppearance, level: number): number {
  const shape = BOTTLE_GEOMETRY[kind], units = Math.max(0, Math.min(4, level))
  if (LIQUID_FINISH !== 'clean') return shape.capacityArea * units / 4
  return area(below(shape.polygon, shape.floorY - (shape.floorY - shape.fullY) * units / 4))
}

/** Horizontal world-space surfaces conserve 2D area as the glass rotates. */
export function liquidSurfaces(kind: BottleAppearance, angle: number, levels: readonly number[]): number[] {
  const shape = BOTTLE_GEOMETRY[kind]
  if (LIQUID_FINISH === 'clean' && angle === 0) return levels.map(level => shape.floorY - (shape.floorY - shape.fullY) * Math.max(0, Math.min(4, level)) / 4)
  const polygon = shape.polygon.map(p => rotate(p, angle))
  const minY = Math.min(...polygon.map(p => p.y)), maxY = Math.max(...polygon.map(p => p.y))
  return levels.map(level => {
    if (level <= 0) return maxY
    const wanted = liquidArea(kind, level)
    let low = minY, high = maxY
    for (let i = 0; i < 22; i++) {
      const mid = (low + high) / 2
      if (area(below(polygon, mid)) > wanted) low = mid
      else high = mid
    }
    return (low + high) / 2
  })
}
/** Keep the free surface at the downhill lip while pouring the TOP color. */
export function pouringAngle(kind: BottleAppearance, level: number): number {
  const shape = BOTTLE_GEOMETRY[kind], wanted = liquidArea(kind, Math.max(.005, level))
  let low = 65, high = 175
  for (let i = 0; i < 18; i++) {
    const mid = (low + high) / 2, lip = rotate({ x: MOUTH.x + shape.mouthRadius, y: MOUTH.y }, mid)
    const volume = area(below(shape.polygon.map(p => rotate(p, mid)), lip.y))
    if (volume > wanted) low = mid
    else high = mid
  }
  return (low + high) / 2
}
