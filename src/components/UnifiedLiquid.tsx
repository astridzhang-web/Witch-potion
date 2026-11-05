import { COLORS } from '../scene/liquidAppearance'
import { rotate, type Point } from '../scene/bottleGeometry'
import type { Bottle } from '../game/rules'

/** Flat color volumes under one shared light field; all planes come from the existing area solve. */
export default function UnifiedLiquid({ id, liquid, level, surfaces, angle, cavity, polygon }: {
  id: string; liquid: Bottle; level: number; surfaces: number[]; angle: number; cavity: string; polygon: readonly Point[]
}) {
  if (level <= 0) return null
  const bands: { color: number; start: number; end: number }[] = []
  for (let i = 0; i < liquid.length && i < level; i++) {
    const previous = bands.at(-1)
    if (previous?.color === liquid[i]) previous.end = i + 1
    else bands.push({ color: liquid[i], start: i, end: i + 1 })
  }
  const top = surfaces.at(-1)!, bottom = surfaces[0]
  const color = COLORS[liquid[Math.max(0, Math.ceil(level) - 1)]]
  const points = polygon.map(p => rotate(p, angle)), hits: number[] = []
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[(i + 1) % points.length]
    if ((p.y <= top && q.y > top) || (q.y <= top && p.y > top)) hits.push(p.x + (q.x - p.x) * (top - p.y) / (q.y - p.y))
  }
  const left = hits.length ? Math.min(...hits) : 50, right = hits.length ? Math.max(...hits) : 50
  return <>
    <defs>
      <clipPath id={`${id}-unified-wet`}><rect x="-160" y={top} width="420" height="420" /></clipPath>
      <linearGradient id={`${id}-shared-depth`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={top} y2={bottom}>
        <stop stopColor="#fff4df" stopOpacity=".10" /><stop offset=".3" stopColor="#fff4df" stopOpacity="0" />
        <stop offset=".6" stopColor="#183144" stopOpacity="0" /><stop offset="1" stopColor="#183144" stopOpacity=".12" />
      </linearGradient>
      <radialGradient id={`${id}-shared-volume`} cx="42%" cy="28%" r="72%">
        <stop stopColor="#fff5e7" stopOpacity=".08" /><stop offset=".55" stopColor="#fff5e7" stopOpacity="0" />
        <stop offset="1" stopColor="#182841" stopOpacity=".07" />
      </radialGradient>
    </defs>
    {bands.map(({ color: c, start, end }) => <g key={start} className="liquid-layer" data-color={c}>
      <rect x="-160" y={surfaces[end]} width="420" height={Math.max(0, surfaces[start] - surfaces[end]) + .03} fill={COLORS[c].main} fillOpacity=".93" />
    </g>)}
    <g className="liquid-lighting" clipPath={`url(#${id}-unified-wet)`}>
      <rect x="-160" y={top} width="420" height={Math.max(0, bottom - top) + .03} fill={`url(#${id}-shared-depth)`} />
      {/* Wall lighting follows the glass, while the enclosing wet plane stays horizontal. */}
      <g transform={`rotate(${angle} 50 10)`}>
        <path d={cavity} fill={`url(#${id}-shared-volume)`} />
        <path className="liquid-wall-depth" d={cavity} fill="none" stroke="#152d3b" strokeWidth="7" opacity=".07" />
        <path d={cavity} fill="none" stroke="#152d3b" strokeWidth="2.8" opacity=".12" />
        <path d={cavity} fill="none" stroke="#fff3db" strokeWidth=".8" opacity=".16" />
      </g>
    </g>
    {liquid.map((c, i) => {
      if (i === 0 || i >= level) return null
      const same = c === liquid[i - 1]
      // Reveal an interface only as it separates from the free surface; no thin-fill pop.
      const reveal = Math.min(1, Math.max(0, (surfaces[i] - top) / 1.5))
      return <path key={i} className="liquid-boundary" data-boundary={same ? 'unit' : 'color'}
        d={`M-160 ${surfaces[i]}H260`} fill="none" stroke={same ? '#fff4df' : COLORS[c].light} strokeWidth=".55" opacity={(same ? .22 : .34) * reveal} />
    })}
    <g clipPath={`url(#${id}-unified-wet)`}>
      <ellipse className="liquid-meniscus" cx={(left + right) / 2} cy={top + .15} rx={Math.max(0, right - left) / 2} ry=".65" fill={color.light} opacity=".25" />
    </g>
    <path className="liquid-surface" d={`M-160 ${top}H260`} fill="none" stroke={color.light} strokeWidth=".65" opacity=".58" />
  </>
}
