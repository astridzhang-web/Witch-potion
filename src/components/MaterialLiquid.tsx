import { COLORS } from '../scene/liquidAppearance'
import { rotate, type Point } from '../scene/bottleGeometry'
import type { Bottle } from '../game/rules'

/** Two art candidates over the same exact unit planes and continuous color coverage.
 * Light belongs to the whole cavity, never to individual units. Masks contain only
 * coefficients; every painted highlight/shadow keeps the liquid's own hue. */
export default function MaterialLiquid({ id, liquid, level, surfaces, angle, cavity, polygon, gem }: {
  id: string; liquid: Bottle; level: number; surfaces: number[]; angle: number; cavity: string; polygon: readonly Point[]; gem: boolean
}) {
  if (level <= 0) return null
  const top = surfaces.at(-1)!, color = COLORS[liquid[Math.max(0, Math.ceil(level) - 1)]]
  const interfaces = liquid.flatMap((c, i) => i > 0 && i < level ? [{ i, same: c === liquid[i - 1] }] : [])
  // The lower color always underpaints an upper edge: antialiasing mixes adjacent
  // liquid colors, never the cabinet. Do this for lighting passes as well.
  const coverage = (i: number) => ({ x: -160, y: -160, width: 420, height: i === 0 ? 420 : surfaces[i] + 160 })
  const tone = (key: 'light' | 'dark') => liquid.map((c, i) => i < level && <rect key={i} {...coverage(i)} fill={COLORS[c][key]} />)
  const fields = gem ? ['volume', 'depth', 'wall', 'bounce'] as const : ['volume', 'depth', 'wall'] as const
  const points = polygon.map(p => rotate(p, angle)), hits: number[] = []
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[(i + 1) % points.length]
    if ((p.y <= top && q.y > top) || (q.y <= top && p.y > top)) hits.push(p.x + (q.x - p.x) * (top - p.y) / (q.y - p.y))
  }
  const left = hits.length ? Math.min(...hits) : 50, right = hits.length ? Math.max(...hits) : 50
  return <>
    <defs>
      <clipPath id={`${id}-experiment-wet`}><rect x="-160" y={top} width="420" height="420" /></clipPath>
      <radialGradient id={`${id}-volume-field`} gradientUnits="userSpaceOnUse" cx="43" cy="98" r="36"
        gradientTransform="translate(43 98) scale(1 .88) translate(-43 -98)">
        <stop stopColor="white" stopOpacity={gem ? '.94' : '.70'} />
        <stop offset=".42" stopColor="white" stopOpacity={gem ? '.62' : '.36'} />
        <stop offset=".85" stopColor="white" stopOpacity={gem ? '.08' : '.035'} />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-depth-field`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="74" y2="126">
        <stop stopColor="white" stopOpacity="0" /><stop offset=".6" stopColor="white" stopOpacity=".015" />
        <stop offset="1" stopColor="white" stopOpacity={gem ? '.18' : '.10'} />
      </linearGradient>
      <linearGradient id={`${id}-wall-field`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="64" y2="128">
        <stop stopColor="white" stopOpacity=".3" /><stop offset=".55" stopColor="white" stopOpacity={gem ? '.9' : '.65'} />
        <stop offset="1" stopColor="white" stopOpacity=".3" />
      </linearGradient>
      <filter id={`${id}-wall-softness`} filterUnits="userSpaceOnUse" x="-160" y="-160" width="420" height="420">
        <feGaussianBlur stdDeviation={gem ? '2.4' : '2'} />
      </filter>
      {gem && <radialGradient id={`${id}-bounce-field`} gradientUnits="userSpaceOnUse" cx="54" cy="115" r="29"
        gradientTransform="translate(54 115) scale(1 .28) translate(-54 -115)">
        <stop stopColor="white" stopOpacity=".32" /><stop offset=".6" stopColor="white" stopOpacity=".12" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>}
      {fields.map(name => <mask key={name} id={`${id}-experiment-${name}`} maskUnits="userSpaceOnUse" x="-160" y="-160" width="420" height="420" style={{ maskType: 'alpha' }}>
        <g transform={`rotate(${angle} 50 10)`}>
          {name === 'wall' ? <path d={cavity} fill="none" stroke={`url(#${id}-wall-field)`} strokeWidth={gem ? '12' : '8'} filter={`url(#${id}-wall-softness)`} />
            : <path d={cavity} fill={`url(#${id}-${name}-field)`} />}
        </g>
      </mask>)}
      {/* A tiny blurred solid stroke survives subpixel alignment, unlike a
          subpixel-wide gradient whose center may miss every device pixel. */}
      {interfaces.map(({ i }) => <filter key={i} id={`${id}-unit-softness-${i}`} filterUnits="userSpaceOnUse" x="-160" y={surfaces[i] - 2} width="420" height="4">
        <feGaussianBlur stdDeviation=".2" />
      </filter>)}
    </defs>
    <g className="liquid-body" opacity=".99" clipPath={`url(#${id}-experiment-wet)`}>
      {liquid.map((c, i) => i < level && <g key={i} className="liquid-layer" data-color={c} data-upper-plane={surfaces[i + 1]} data-lower-plane={surfaces[i]}>
        <rect {...coverage(i)} fill={COLORS[c].main} />
      </g>)}
      <g className="liquid-lighting" data-material={gem ? 'material-b' : 'material-a'}>
        {fields.map(name => <g key={name} className={`liquid-material-${name}`} mask={`url(#${id}-experiment-${name})`}>
          {tone(name === 'depth' || name === 'wall' ? 'dark' : 'light')}
        </g>)}
      </g>
    </g>
    {interfaces.map(({ i, same }) => <path key={i} className="liquid-boundary" data-boundary={same ? 'unit' : 'color'} data-unit={i}
      d={`M-160 ${surfaces[i]}H260`} fill="none" stroke="#55515a" strokeWidth={same ? '.6' : '.7'} strokeOpacity={same ? '.26' : '.38'} filter={`url(#${id}-unit-softness-${i})`} opacity={Math.min(1, Math.max(0, (surfaces[i] - top) / 1.5))} />)}
    {/* Only the free surface has a shallow meniscus; all internal cues are level. */}
    <g clipPath={`url(#${id}-experiment-wet)`}>
      <path className="liquid-surface" d={`M${left} ${top}Q${(left + right) / 2} ${top + .7} ${right} ${top}`} fill="none" stroke={color.light} strokeWidth=".6" opacity={gem ? '.62' : '.48'} />
    </g>
  </>
}
