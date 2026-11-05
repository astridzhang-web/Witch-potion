import { COLORS } from '../scene/liquidAppearance'
import type { Bottle } from '../game/rules'

/** Chromatic internal light, shared across the entire volume. The fixed light
 * fields are alpha coefficients only; the painted light/depth retain each hue. */
export default function BrightLiquid({ id, liquid, level, surfaces, angle, cavity }: {
  id: string; liquid: Bottle; level: number; surfaces: number[]; angle: number; cavity: string
}) {
  if (level <= 0) return null
  const top = surfaces.at(-1)!, color = COLORS[liquid[Math.max(0, Math.ceil(level) - 1)]]
  const interfaces = liquid.flatMap((c, i) => i > 0 && i < level && c !== liquid[i - 1] ? [i] : [])
  // Paint bottom color over the complete wet volume, then overlay each upper
  // color down to its exact lower plane. Shared edges always have opaque color
  // underneath, so SVG antialiasing cannot expose the cabinet between units.
  const coverage = (i: number) => ({ x: -160, y: -160, width: 420, height: i === 0 ? 420 : surfaces[i] + 160 })
  const tone = (key: 'light' | 'dark') => liquid.map((c, i) => i < level && <rect key={i} {...coverage(i)} fill={COLORS[c][key]} />)
  return <>
    <defs>
      <clipPath id={`${id}-bright-wet`}><rect x="-160" y={top} width="420" height="420" /></clipPath>
      <radialGradient id={`${id}-inner-light`} gradientUnits="userSpaceOnUse" cx="42" cy="98" r="53"
        gradientTransform="translate(42 98) scale(1.1 .95) translate(-42 -98)">
        <stop stopColor="white" stopOpacity=".48" />
        <stop offset=".45" stopColor="white" stopOpacity=".22" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-inner-depth`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="72" y2="136">
        <stop stopColor="white" stopOpacity="0" />
        <stop offset=".6" stopColor="white" stopOpacity=".025" />
        <stop offset="1" stopColor="white" stopOpacity=".12" />
      </linearGradient>
      {(['light', 'depth'] as const).map(name => <mask key={name} id={`${id}-inner-${name}-mask`}
        maskUnits="userSpaceOnUse" x="-160" y="-160" width="420" height="420" style={{ maskType: 'alpha' }}>
        <path d={cavity} transform={`rotate(${angle} 50 10)`} fill={`url(#${id}-inner-${name})`} />
      </mask>)}
      {interfaces.map(i => <linearGradient key={i} id={`${id}-bright-interface-${i}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={surfaces[i] - .11} y2={surfaces[i] + .11}>
        <stop stopColor="#62595a" stopOpacity="0" /><stop offset=".2" stopColor="#62595a" stopOpacity=".02" />
        <stop offset=".5" stopColor="#62595a" stopOpacity=".12" /><stop offset=".8" stopColor="#62595a" stopOpacity=".02" />
        <stop offset="1" stopColor="#62595a" stopOpacity="0" />
      </linearGradient>)}
    </defs>
    {/* Apply coverage once to the whole volume, never separately at unit edges. */}
    <g className="liquid-body" opacity=".98" clipPath={`url(#${id}-bright-wet)`}>
      {liquid.map((c, i) => i < level && <g key={i} className="liquid-layer" data-color={c} data-upper-plane={surfaces[i + 1]} data-lower-plane={surfaces[i]}>
        <rect {...coverage(i)} fill={COLORS[c].main} />
      </g>)}
      <g className="liquid-lighting" data-material="luminous-liquid" clipPath={`url(#${id}-bright-wet)`}>
        <g className="liquid-inner-light" mask={`url(#${id}-inner-light-mask)`}>{tone('light')}</g>
        <g className="liquid-inner-depth" mask={`url(#${id}-inner-depth-mask)`}>{tone('dark')}</g>
      </g>
    </g>
    {interfaces.map(i => <path key={i} className="liquid-boundary" data-boundary="color" data-unit={i}
      d={`M-160 ${surfaces[i]}H260`} fill="none" stroke={`url(#${id}-bright-interface-${i})`} strokeWidth=".22" opacity={Math.min(1, Math.max(0, (surfaces[i] - top) / 1.5))} />)}
    <path className="liquid-surface" d={`M-160 ${top}H260`} fill="none" stroke={color.light} strokeWidth=".45" opacity=".42" />
  </>
}
