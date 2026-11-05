import { COLORS } from '../scene/liquidAppearance'
import type { Bottle } from '../game/rules'

/** Fixed cavity-space optical fields shared by every color; no per-unit shading. */
export default function LuminousLiquid({ id, liquid, level, surfaces, angle, cavity, gem }: {
  id: string; liquid: Bottle; level: number; surfaces: number[]; angle: number; cavity: string; gem: boolean
}) {
  if (level <= 0) return null
  const top = surfaces.at(-1)!, color = COLORS[liquid[Math.max(0, Math.ceil(level) - 1)]]
  return <>
    <defs>
      <clipPath id={`${id}-material-wet`}><rect x="-160" y={top} width="420" height="420" /></clipPath>
      <linearGradient id={`${id}-transmission`} gradientUnits="userSpaceOnUse" x1="17" x2="84">
        <stop stopColor="#453e3d" stopOpacity={gem ? '.13' : '.09'} />
        <stop offset=".16" stopColor="#f4eedc" stopOpacity={gem ? '.055' : '.04'} />
        <stop offset=".38" stopColor="#e4f0ed" stopOpacity=".10" />
        <stop offset=".65" stopColor="#e4f0ed" stopOpacity="0" />
        <stop offset=".88" stopColor="#453e3d" stopOpacity=".02" />
        <stop offset="1" stopColor="#453e3d" stopOpacity={gem ? '.11' : '.065'} />
      </linearGradient>
      {gem && <radialGradient id={`${id}-luster`} gradientUnits="userSpaceOnUse" cx="40" cy="99" r="43"
        gradientTransform="translate(40 99) scale(1 .8) translate(-40 -99)">
        <stop stopColor="#edf1e5" stopOpacity=".15" />
        <stop offset=".6" stopColor="#edf1e5" stopOpacity=".035" />
        <stop offset="1" stopColor="#edf1e5" stopOpacity="0" />
      </radialGradient>}
      {liquid.map((_, i) => i > 0 && i < level && <linearGradient key={i} id={`${id}-soft-seam-${i}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={surfaces[i] - .325} y2={surfaces[i] + .325}>
        <stop stopColor="#544d47" stopOpacity="0" /><stop offset=".2" stopColor="#544d47" stopOpacity=".05" />
        <stop offset=".5" stopColor="#544d47" stopOpacity=".28" /><stop offset=".8" stopColor="#544d47" stopOpacity=".05" />
        <stop offset="1" stopColor="#544d47" stopOpacity="0" />
      </linearGradient>)}
    </defs>
    {liquid.map((c, i) => i < level && <g key={i} className="liquid-layer" data-color={c}>
      <rect x="-160" y={surfaces[i + 1]} width="420" height={Math.max(0, surfaces[i] - surfaces[i + 1]) + .03} fill={COLORS[c].main} fillOpacity={gem ? '.93' : '.92'} />
    </g>)}
    <g className="liquid-lighting" clipPath={`url(#${id}-material-wet)`} data-material={gem ? 'gem-luster' : 'soft-translucent'}>
      <g transform={`rotate(${angle} 50 10)`}>
        <path d={cavity} fill={`url(#${id}-transmission)`} />
        {gem && <path className="liquid-luster" d={cavity} fill={`url(#${id}-luster)`} />}
      </g>
    </g>
    {liquid.map((_, i) => i > 0 && i < level && <path key={i} className="liquid-boundary" data-boundary="seam" data-unit={i}
      d={`M-160 ${surfaces[i]}H260`} fill="none" stroke={`url(#${id}-soft-seam-${i})`} strokeWidth=".65" opacity={Math.min(1, Math.max(0, (surfaces[i] - top) / 1.5))} />)}
    <path className="liquid-surface" d={`M-160 ${top}H260`} fill="none" stroke={color.light} strokeWidth=".55" opacity={gem ? '.52' : '.45'} />
  </>
}
