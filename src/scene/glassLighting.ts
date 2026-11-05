import { BOTTLE_SIZE, BOTTLE_X, CABINET, SHELF_Y } from './cabinetLayout'
import { bottleVisualScale } from './bottlePresentation'

// Internal page comparison; independent of glass/liquid choices and never persisted.
const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('lighting')
export const GLASS_LIGHTING = requested === 'flat' || requested === 'soft' ? requested : 'ambient'
export const SOFT_GLASS = '/assets/bottles/star-moon-glass-soft.webp'
export const GLASS_RESPONSE = '/assets/bottles/star-moon-glass-response.webp'

/** Artwork coordinates on the unchanged 841×1870 cabinet, not screen pixels.
 * Candle flames/lanterns are visible near these edge positions; the moon is in
 * the upper window. Broad radii approximate reflected light, not new scene lamps. */
export const CABINET_LIGHTS = [
  { id: 'left-candle', x: 16, y: 610, radius: 580, color: '#f2ca96', strength: .25 },
  { id: 'right-candle', x: 817, y: 574, radius: 600, color: '#efd2a4', strength: .25 },
  { id: 'left-low-candle', x: 21, y: 940, radius: 580, color: '#edc492', strength: .22 },
  { id: 'right-low-lamp', x: 834, y: 1280, radius: 620, color: '#f0c58f', strength: .23 },
  { id: 'foot-candle', x: 10, y: 1578, radius: 470, color: '#eecb9e', strength: .18 },
  { id: 'moon-window', x: 326, y: 40, radius: 850, color: '#b6c9e1', strength: .13 },
] as const

// SVG (0,0) translation, uniform scale and mouth-pivot angle in cabinet coordinates.
export interface GlassPose { x: number; y: number; scale: number; angle: number }
export interface SceneRect { left: number; top: number; width: number }
export function restGlassPose(index: number): GlassPose {
  const scale = BOTTLE_SIZE.width / 100 * bottleVisualScale(index)
  return { x: BOTTLE_X[index % 3] - 50 * scale, y: SHELF_Y[Math.floor(index / 3)] - 134 * scale, scale, angle: 0 }
}
export function screenGlassPose(x: number, y: number, width: number, angle: number, scene: SceneRect): GlassPose {
  const scale = scene.width / CABINET.width
  return { x: (x - scene.left) / scale, y: (y - scene.top) / scale, scale: width / 100 / scale, angle }
}
/** Inverse of the existing mouth-pivot sprite transform. A fixed world light
 * therefore stays fixed while the glass translation AND orientation change. */
export function localLight(point: { x: number; y: number }, pose: GlassPose) {
  const r = pose.angle * Math.PI / 180, dx = (point.x - pose.x) / pose.scale - 50, dy = (point.y - pose.y) / pose.scale - 10
  return { x: 50 + dx * Math.cos(r) + dy * Math.sin(r), y: 10 - dx * Math.sin(r) + dy * Math.cos(r) }
}
