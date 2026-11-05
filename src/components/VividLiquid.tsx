import { COLORS } from '../scene/liquidAppearance'
import type { Bottle } from '../game/rules'

/** Saturated color volumes with genuine shared transmission. Color units composite
 * BEFORE the opacity mask, so their antialias overlap cannot create dark stripes. */
export default function VividLiquid({ id, liquid, level, surfaces, angle, cavity }: {
  id: string; liquid: Bottle; level: number; surfaces: number[]; angle: number; cavity: string
}) {
  if (level <= 0) return null
  const top = surfaces.at(-1)!, color = COLORS[liquid[Math.max(0, Math.ceil(level) - 1)]]
  return <>
    <defs>
      <clipPath id={`${id}-vivid-wet`}><rect x="-160" y={top} width="420" height="420" /></clipPath>
      {/* Fixed cavity coordinates approximate a thicker center and thinner walls.
          This field never restarts at a unit boundary or rescales with fill level. */}
      <radialGradient id={`${id}-vivid-depth`} gradientUnits="userSpaceOnUse" cx="50" cy="100" r="42"
        gradientTransform="translate(50 100) scale(1 .76) translate(-50 -100)">
        <stop stopColor="white" stopOpacity=".78" />
        <stop offset=".55" stopColor="white" stopOpacity=".76" />
        <stop offset="1" stopColor="white" stopOpacity=".58" />
      </radialGradient>
      <mask id={`${id}-vivid-transmission`} maskUnits="userSpaceOnUse" x="-160" y="-160" width="420" height="420" style={{ maskType: 'alpha' }}>
        <path d={cavity} transform={`rotate(${angle} 50 10)`} fill={`url(#${id}-vivid-depth)`} />
      </mask>
      <linearGradient id={`${id}-vivid-reflection`} gradientUnits="userSpaceOnUse" x1="17" x2="84">
        <stop stopColor="#f2efde" stopOpacity=".02" />
        <stop offset=".28" stopColor="#f2efde" stopOpacity=".035" />
        <stop offset=".52" stopColor="#f2efde" stopOpacity="0" />
        <stop offset=".84" stopColor="#f2efde" stopOpacity=".01" />
        <stop offset="1" stopColor="#f2efde" stopOpacity=".02" />
      </linearGradient>
      {liquid.map((_, i) => i > 0 && i < level && <linearGradient key={i} id={`${id}-vivid-seam-${i}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={surfaces[i] - .19} y2={surfaces[i] + .19}>
        <stop stopColor="#544d47" stopOpacity="0" /><stop offset=".2" stopColor="#544d47" stopOpacity=".035" />
        <stop offset=".5" stopColor="#544d47" stopOpacity=".20" /><stop offset=".8" stopColor="#544d47" stopOpacity=".035" />
        <stop offset="1" stopColor="#544d47" stopOpacity="0" />
      </linearGradient>)}
    </defs>
    <g className="liquid-transmission" mask={`url(#${id}-vivid-transmission)`}>
      {liquid.map((c, i) => i < level && <g key={i} className="liquid-layer" data-color={c}>
        <rect x="-160" y={surfaces[i + 1]} width="420" height={Math.max(0, surfaces[i] - surfaces[i + 1]) + .03} fill={COLORS[c].main} />
      </g>)}
    </g>
    <g className="liquid-lighting" data-material="vivid-translucent" clipPath={`url(#${id}-vivid-wet)`}>
      <path d={cavity} transform={`rotate(${angle} 50 10)`} fill={`url(#${id}-vivid-reflection)`} />
    </g>
    {liquid.map((_, i) => i > 0 && i < level && <path key={i} className="liquid-boundary" data-boundary="seam" data-unit={i}
      d={`M-160 ${surfaces[i]}H260`} fill="none" stroke={`url(#${id}-vivid-seam-${i})`} strokeWidth=".38" opacity={Math.min(1, Math.max(0, (surfaces[i] - top) / 1.5))} />)}
    <path className="liquid-surface" d={`M-160 ${top}H260`} fill="none" stroke={color.light} strokeWidth=".45" opacity=".38" />
  </>
}
