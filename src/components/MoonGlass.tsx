import StarMoonGlass from './StarMoonGlass'
import { GLASS_FINISH, MOON_GLASS, MOON_TRANSFORM } from '../scene/moonGlass'

/** The original two-pass treatment remains selectable with ?glass=original. */
export default function MoonGlass({ id, cavity }: { id: string; cavity: string }) {
  if (GLASS_FINISH === 'star-moon') return <StarMoonGlass />
  const candle = GLASS_FINISH === 'candle'
  return <>
    <defs>
      <mask id={`${id}-glass-alpha`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="150" style={{ maskType: 'luminance' }}>
        <path d={MOON_GLASS.outline} transform={MOON_TRANSFORM} fill="#b8b8b8" />
        <path d={cavity} fill={candle ? "#585858" : "#606060"} />
        <path d={MOON_GLASS.neck} transform={MOON_TRANSFORM} fill={candle ? "#383838" : "#444"} />
      </mask>
      <linearGradient id={`${id}-foot-fade`} gradientUnits="userSpaceOnUse" x1="0" y1="121" x2="0" y2="134">
        <stop stopColor="white" /><stop offset=".45" stopColor={candle ? "#999" : "#c4c4c4"} /><stop offset="1" stopColor={candle ? "#666" : "#999"} />
      </linearGradient>
      <mask id={`${id}-foot-alpha`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="150" style={{ maskType: 'luminance' }}>
        <rect width="100" height="150" fill={`url(#${id}-foot-fade)`} />
      </mask>
      <filter id={`${id}-candle-reflection`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        {/* Temper existing cool-white highlights toward candlelight; retain cool edges.
            This pass does not tint the liquid or the separate original gold detail. */}
        <feColorMatrix type="matrix" values=".98 .035 .015 0 0  .025 .95 .005 0 0  .02 .02 .86 0 0  0 0 0 1 0" />
      </filter>
      <clipPath id={`${id}-art-outline`}><path d={MOON_GLASS.outline} transform={MOON_TRANSFORM} /></clipPath>
      <filter id={`${id}-warm-detail`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        {/* Restore warm metal/highlights, without restoring the opaque blue-gray neck. */}
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  4 0 -4 0 0" result="warm" />
        <feComposite in="SourceGraphic" in2="warm" operator="in" />
      </filter>
    </defs>
    <g className="moon-glass-art" data-finish={GLASS_FINISH} clipPath={`url(#${id}-art-outline)`} mask={`url(#${id}-foot-alpha)`}>
      <g mask={`url(#${id}-glass-alpha)`} filter={candle ? undefined : `url(#${id}-candle-reflection)`}>
        <image className="moon-glass-texture" href={candle ? "/assets/bottles/moon-glass-candle.webp" : MOON_GLASS.src} width={MOON_GLASS.width} height={MOON_GLASS.height} transform={MOON_TRANSFORM} preserveAspectRatio="xMidYMid meet" />
      </g>
      <g filter={`url(#${id}-warm-detail)`}>
        <image href={MOON_GLASS.src} width={MOON_GLASS.width} height={MOON_GLASS.height} transform={MOON_TRANSFORM} preserveAspectRatio="xMidYMid meet" />
      </g>
    </g>
  </>
}
