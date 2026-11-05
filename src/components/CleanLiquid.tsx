import { COLORS } from '../scene/liquidAppearance'
import type { Bottle } from '../game/rules'

/** Equal-height units use one quiet material and identical soft gray seams. */
export default function CleanLiquid({ id, liquid, level, surfaces, angle, cavity }: {
  id: string; liquid: Bottle; level: number; surfaces: number[]; angle: number; cavity: string
}) {
  if (level <= 0) return null
  const top = surfaces.at(-1)!
  const topColor = COLORS[liquid[Math.max(0, Math.ceil(level) - 1)]]
  return <>
    <defs>
      <clipPath id={`${id}-clean-wet`}><rect x="-160" y={top} width="420" height="420" /></clipPath>
      <linearGradient id={`${id}-quiet-glass`}>
        <stop stopColor="#71563f" stopOpacity=".05" /><stop offset=".2" stopColor="#fff0d4" stopOpacity=".025" />
        <stop offset=".5" stopColor="#fff0d4" stopOpacity="0" /><stop offset=".8" stopColor="#fff0d4" stopOpacity=".02" />
        <stop offset="1" stopColor="#71563f" stopOpacity=".05" />
      </linearGradient>
      {liquid.map((_, i) => i > 0 && i < level && <linearGradient key={i} id={`${id}-seam-${i}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={surfaces[i] - .6} y2={surfaces[i] + .6}>
        <stop stopColor="#544d47" stopOpacity="0" /><stop offset=".2" stopColor="#544d47" stopOpacity=".07" />
        <stop offset=".5" stopColor="#544d47" stopOpacity=".38" /><stop offset=".8" stopColor="#544d47" stopOpacity=".07" />
        <stop offset="1" stopColor="#544d47" stopOpacity="0" />
      </linearGradient>)}
    </defs>
    {liquid.map((c, i) => i < level && <g key={i} className="liquid-layer" data-color={c}>
      <rect x="-160" y={surfaces[i + 1]} width="420" height={Math.max(0, surfaces[i] - surfaces[i + 1]) + .03} fill={COLORS[c].main} fillOpacity=".94" />
    </g>)}
    <g className="liquid-lighting" clipPath={`url(#${id}-clean-wet)`}>
      {/* Glass stays responsible for the main reflections; no blue-gray bottom shade. */}
      <path d={cavity} transform={`rotate(${angle} 50 10)`} fill={`url(#${id}-quiet-glass)`} />
    </g>
    {liquid.map((_, i) => i > 0 && i < level && <path key={i} className="liquid-boundary" data-boundary="seam" data-unit={i}
      d={`M-160 ${surfaces[i]}H260`} fill="none" stroke={`url(#${id}-seam-${i})`} strokeWidth="1.2" opacity={Math.min(1, Math.max(0, (surfaces[i] - top) / 1.5))} />)}
    <path className="liquid-surface" d={`M-160 ${top}H260`} fill="none" stroke={topColor.light} strokeWidth=".65" opacity=".48" />
  </>
}
