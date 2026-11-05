import { COLORS } from '../scene/liquidAppearance'
import { rotate, type Point } from '../scene/bottleGeometry'
import type { Bottle } from '../game/rules'

/** Painted light only: the existing planes and cavity still own every unit of volume. */
export default function PolishedLiquid({ id, liquid, level, surfaces, angle, cavity, polygon }: {
  id: string; liquid: Bottle; level: number; surfaces: number[]; angle: number; cavity: string; polygon: readonly Point[]
}) {
  if (level <= 0) return null
  // Identical adjacent units are one continuous fluid, not four artificial stripes.
  const bands: { color: number; start: number; end: number }[] = []
  for (let i = 0; i < liquid.length && i < level; i++) {
    const previous = bands.at(-1)
    if (previous?.color === liquid[i]) previous.end = i + 1
    else bands.push({ color: liquid[i], start: i, end: i + 1 })
  }
  const top = surfaces.at(-1)!
  const color = COLORS[liquid[Math.max(0, Math.ceil(level) - 1)]]
  // Actual intersections with the world-horizontal surface, not a fixed-width oval.
  const points = polygon.map(p => rotate(p, angle)), hits: number[] = []
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[(i + 1) % points.length]
    if ((p.y <= top && q.y > top) || (q.y <= top && p.y > top)) hits.push(p.x + (q.x - p.x) * (top - p.y) / (q.y - p.y))
  }
  const left = hits.length ? Math.min(...hits) : 50, right = hits.length ? Math.max(...hits) : 50
  return <>
    <defs>
      <clipPath id={`${id}-wet-volume`}><rect x="-160" y={top} width="420" height="420" /></clipPath>
      <radialGradient id={`${id}-liquid-volume`} cx="42%" cy="28%" r="72%">
        <stop stopColor="#fff5e7" stopOpacity=".10" /><stop offset=".55" stopColor="#fff5e7" stopOpacity="0" />
        <stop offset="1" stopColor="#182841" stopOpacity=".09" />
      </radialGradient>
      {bands.map(({ color: c, start, end }) => <linearGradient key={start} id={`${id}-depth-${start}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={surfaces[end]} y2={surfaces[start]}>
        <stop stopColor={COLORS[c].light} /><stop offset=".18" stopColor={COLORS[c].main} />
        <stop offset=".65" stopColor={COLORS[c].main} /><stop offset="1" stopColor={COLORS[c].dark} />
      </linearGradient>)}
    </defs>
    {bands.map(({ color: c, start, end }) => <g key={start} className="liquid-layer" data-color={c}>
      <rect x="-160" y={surfaces[end]} width="420" height={Math.max(0, surfaces[start] - surfaces[end]) + .03} fill={`url(#${id}-depth-${start})`} fillOpacity=".93" />
      <path className="liquid-boundary" d={`M-160 ${surfaces[end]}H260`} stroke={COLORS[c].light} strokeWidth=".5" opacity=".36" />
    </g>)}
    <g clipPath={`url(#${id}-wet-volume)`}>
      {/* Edge depth belongs to the glass; it remains clipped to the moving liquid. */}
      <g transform={`rotate(${angle} 50 10)`}>
        <path d={cavity} fill={`url(#${id}-liquid-volume)`} />
        <path className="liquid-wall-depth" d={cavity} fill="none" stroke="#152d3b" strokeWidth="7" opacity=".07" />
        <path d={cavity} fill="none" stroke="#152d3b" strokeWidth="2.8" opacity=".12" />
        <path d={cavity} fill="none" stroke="#fff3db" strokeWidth=".8" opacity=".16" />
      </g>
      <ellipse className="liquid-meniscus" cx={(left + right) / 2} cy={top + .25} rx={Math.max(0, right - left) / 2} ry=".9" fill={color.light} opacity=".26" />
    </g>
    <path className="liquid-surface" d={`M-160 ${top}H260`} fill="none" stroke={color.light} strokeWidth=".65" opacity=".55" />
  </>
}
