import MoonGlass from './MoonGlass'
import { useId, type CSSProperties } from 'react'
import { isComplete, type Color, type Bottle as BottleState } from '../game/rules'
import { BOTTLE_GEOMETRY, bottleAppearance, liquidSurfaces, type BottleAppearance } from '../scene/bottleGeometry'

import PolishedLiquid from './PolishedLiquid'
import UnifiedLiquid from './UnifiedLiquid'
import CleanLiquid from './CleanLiquid'
import LuminousLiquid from './LuminousLiquid'
import VividLiquid from './VividLiquid'
import BrightLiquid from './BrightLiquid'
import { COLORS, LIQUID_FINISH } from '../scene/liquidAppearance'
import { restGlassPose, type GlassPose } from '../scene/glassLighting'
import { CABINET } from '../scene/cabinetLayout'
export { COLORS } from '../scene/liquidAppearance'

interface Props {
  liquid: BottleState
  style?: CSSProperties
  index: number
  selected: boolean
  won: boolean
  busy?: boolean
  animating?: boolean
  receiving?: boolean
  onClick(): void
}
export default function Bottle({ liquid, index, selected, won, busy, animating, receiving, style, onClick }: Props) {
  const complete = isComplete(liquid)
  const glassPose = restGlassPose(index)
  // The existing 5px selected lift is screen-space, not cabinet-space. It needs
  // only an event-time adjustment; resting glass has no animation loop/state.
  if (selected && typeof document !== 'undefined') {
    const scene = document.querySelector('.cabinet-scene')?.getBoundingClientRect()
    if (scene?.width) glassPose.y -= 5 * CABINET.width / scene.width
  }
  const contents = liquid.length ? `从上到下：${[...liquid].reverse().map((c) => COLORS[c].name).join('、')}` : '空瓶'
  return <button
    className={`bottle ${selected ? 'is-selected' : ''} ${complete ? 'is-complete' : ''} ${animating ? 'is-animating' : ''} ${receiving ? 'is-receiving' : ''}`}
    style={style}
    type="button"
    data-testid={`bottle-${index}`}
    data-liquid={liquid.join(',')}
    aria-label={`药瓶 ${index + 1}，${contents}${complete ? '，已完成' : ''}`}
    aria-pressed={selected}
    disabled={won || busy}
    onClick={onClick}
  >
    <span className="bottle-halo" />
    <span className="bottle-contact-shadow" aria-hidden="true" />
    <BottleArt liquid={liquid} kind={bottleAppearance(index)} glassPose={glassPose} />
    <span className="bottle-number">{complete ? <span aria-hidden="true">✓</span> : String(index + 1).padStart(2, '0')}{liquid.length === 0 && <span className="empty-label">空瓶</span>}</span>
  </button>
}

/** Glass and liquid stay independent; only the liquid counter-rotates against gravity. */
export function BottleArt({ liquid, kind = 'round', fillLevel = liquid.length, angle = 0, pouring = false, receivingColor, glassPose = restGlassPose(0) }: {
  liquid: BottleState; kind?: BottleAppearance; fillLevel?: number; angle?: number; pouring?: boolean; receivingColor?: Color; glassPose?: GlassPose
}) {
  const id = useId().replace(/:/g, '')
  const shape = BOTTLE_GEOMETRY[kind]
  const level = Math.max(0, Math.min(fillLevel, liquid.length))
  const surfaces = liquidSurfaces(kind, angle, Array.from({ length: liquid.length + 1 }, (_, i) => Math.min(i, level)))
  const topColor = liquid[Math.max(0, Math.ceil(level) - 1)]
  return <svg className="bottle-art" viewBox="0 0 100 150" aria-hidden="true" data-kind={kind} data-liquid-finish={LIQUID_FINISH} data-fill-level={level} data-angle={angle}>
    <defs>
      <clipPath id={`${id}-cavity`}><path d={shape.clip} /></clipPath>
      <linearGradient id={`${id}-glass`}>
        <stop stopColor="#dae7ed" stopOpacity=".12" /><stop offset=".3" stopColor="#dae7ed" stopOpacity=".015" />
        <stop offset=".72" stopColor="#dae7ed" stopOpacity=".025" /><stop offset="1" stopColor="#dae7ed" stopOpacity=".14" />
      </linearGradient>
      <linearGradient id={`${id}-brass`}>
        <stop stopColor="#9b784b" /><stop offset=".45" stopColor="#e0cb95" /><stop offset="1" stopColor="#ad8c57" />
      </linearGradient>
      {COLORS.map((color, i) => <linearGradient key={i} id={`${id}-color-${i}`} gradientUnits="userSpaceOnUse" x1="12" x2="88">
        <stop stopColor={color.dark} /><stop offset=".25" stopColor={color.main} />
        <stop offset=".7" stopColor={color.light} /><stop offset="1" stopColor={color.main} />
      </linearGradient>)}
    </defs>
    {kind !== 'moon-glass' && <path d={shape.outline} fill={`url(#${id}-glass)`} />}
    <g className="liquid-cavity" clipPath={`url(#${id}-cavity)`}>
      <g className="gravity-liquid" transform={`rotate(${-angle} 50 10)`}>
        {LIQUID_FINISH === 'luminous-liquid' ? <BrightLiquid id={id} liquid={liquid} level={level} surfaces={surfaces} angle={angle} cavity={shape.clip} /> : LIQUID_FINISH === 'vivid-translucent' ? <VividLiquid id={id} liquid={liquid} level={level} surfaces={surfaces} angle={angle} cavity={shape.clip} /> : LIQUID_FINISH === 'soft-translucent' || LIQUID_FINISH === 'gem-luster' ? <LuminousLiquid id={id} liquid={liquid} level={level} surfaces={surfaces} angle={angle} cavity={shape.clip} gem={LIQUID_FINISH === 'gem-luster'} /> : LIQUID_FINISH === 'clean' ? <CleanLiquid id={id} liquid={liquid} level={level} surfaces={surfaces} angle={angle} cavity={shape.clip} /> : LIQUID_FINISH === 'unified' ? <UnifiedLiquid id={id} liquid={liquid} level={level} surfaces={surfaces} angle={angle} cavity={shape.clip} polygon={shape.polygon} /> : LIQUID_FINISH === 'polished' ? <PolishedLiquid id={id} liquid={liquid} level={level} surfaces={surfaces} angle={angle} cavity={shape.clip} polygon={shape.polygon} /> : <>
        {liquid.map((color, i) => i < level && <g key={i} className="liquid-layer" data-color={color}>
          <rect x="-160" y={surfaces[i + 1]} width="420" height={Math.max(0, surfaces[i] - surfaces[i + 1]) + .03} fill={`url(#${id}-color-${color})`} fillOpacity=".92" />
          <path className="liquid-boundary" d={`M-160 ${surfaces[i + 1]}H260`} stroke={COLORS[color].light} strokeWidth=".8" opacity=".8" />
        </g>)}
        {level > 0 && <path className="liquid-surface" d={`M-160 ${surfaces.at(-1)}H260`} fill="none" stroke={COLORS[topColor].light} strokeWidth="1.25" opacity=".85" />}
        </>}
      </g>
      {receivingColor !== undefined && <g>
        <path className="receiving-flow" d={`M50 10V${surfaces.at(-1)}`} stroke={COLORS[receivingColor].light} strokeWidth="1.8" opacity=".6" />
        <ellipse cx="50" cy={surfaces.at(-1)} rx="12" ry="1.3" fill="none" stroke={COLORS[receivingColor].light} strokeWidth=".9" opacity=".65" />
      </g>}
    </g>
    {kind === 'moon-glass' ? <MoonGlass id={id} cavity={shape.clip} pose={glassPose} /> : <>
    <path d={shape.outline} fill="none" stroke="#c8d8df" strokeOpacity=".6" strokeWidth="1" />
    <path d="M45 15V44M55 15V43" fill="none" stroke="#eef4ee" strokeOpacity=".38" strokeWidth="1.1" />
    {kind === 'round' && <path d="M29 77Q18 94 24 111M77 88Q82 107 71 119" fill="none" stroke="#edf1e8" strokeOpacity=".24" strokeWidth="1.8" strokeLinecap="round" />}
    {kind === 'pear' && <path d="M36 72Q20 104 29 117M70 93Q78 112 68 122" fill="none" stroke="#edf1e8" strokeOpacity=".25" strokeWidth="1.7" strokeLinecap="round" />}
    {kind === 'faceted' && <path d="M33 67L35 102L42 130M67 67L65 102L58 130M21 100L35 102L65 102L79 100" fill="none" stroke="#e1e8e6" strokeOpacity=".25" strokeWidth=".9" />}
    <g fill="none" stroke={`url(#${id}-brass)`} strokeWidth=".85">
      <ellipse cx="50" cy="45" rx="8.5" ry="1.8" />
      <path d="M42 45V48Q50 51 58 48V45M50 50V55L52 58L50 61L48 58L50 55M35 130Q50 137 65 130" />
    </g>
    <ellipse cx="50" cy="10" rx="9" ry="2.8" fill="#152027" fillOpacity=".6" stroke="#d1d8cd" strokeOpacity=".8" strokeWidth="1" />
    <ellipse cx="50" cy="10" rx="6.7" ry="1.4" fill="#0d1421" fillOpacity=".8" stroke="#dfcd9f" strokeOpacity=".55" strokeWidth=".6" />
    </>}
    {pouring && level > 0 && <path className="wet-lip" d={`M${50 + Math.sign(angle) * (shape.mouthRadius - 2)} 11L${50 + Math.sign(angle) * shape.mouthRadius} 10`} stroke={COLORS[topColor].light} strokeWidth="1.7" strokeLinecap="round" />}
  </svg>
}
