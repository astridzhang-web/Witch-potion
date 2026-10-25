/** Presentation geometry only; the four-unit game state remains in game/rules. */
export type BottleKind = 'round' | 'pear' | 'faceted'
export interface Point { x: number; y: number }
export const MOUTH = { x: 50, y: 10, radius: 7 }
export const CONTACT = { x: 50, y: 134 }
const kinds: BottleKind[] = ['round', 'pear', 'faceted']
export const bottleKind = (index: number) => kinds[index % kinds.length]

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
export const BOTTLE_GEOMETRY = Object.fromEntries(kinds.map(kind => {
  const polygon = cavity(kind)
  return [kind, { outline: paths[kind], polygon, clip: `M${polygon.map(p => `${p.x},${p.y}`).join('L')}Z`,
    capacityArea: area(below(polygon, kind === 'faceted' ? 72 : 76)) }]
})) as Record<BottleKind, { outline: string; polygon: Point[]; clip: string; capacityArea: number }>

/** Horizontal world-space surfaces conserve 2D area as the glass rotates. */
export function liquidSurfaces(kind: BottleKind, angle: number, levels: readonly number[]): number[] {
  const shape = BOTTLE_GEOMETRY[kind], polygon = shape.polygon.map(p => rotate(p, angle))
  const minY = Math.min(...polygon.map(p => p.y)), maxY = Math.max(...polygon.map(p => p.y))
  return levels.map(level => {
    if (level <= 0) return maxY
    const wanted = shape.capacityArea * Math.min(4, level) / 4
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
export function pouringAngle(kind: BottleKind, level: number): number {
  const shape = BOTTLE_GEOMETRY[kind], wanted = shape.capacityArea * Math.max(.005, level) / 4
  let low = 65, high = 175
  for (let i = 0; i < 18; i++) {
    const mid = (low + high) / 2, lip = rotate({ x: MOUTH.x + MOUTH.radius, y: MOUTH.y }, mid)
    const volume = area(below(shape.polygon.map(p => rotate(p, mid)), lip.y))
    if (volume > wanted) low = mid
    else high = mid
  }
  return (low + high) / 2
}
