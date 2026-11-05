import { STAR_MOON_GLASS, STAR_MOON_TRANSFORM } from '../scene/starMoonGlass'

/** New warm artwork: native RGB, cleaned alpha, no legacy tint/mask/highlight filter. */
export default function StarMoonGlass() {
  return <g className="moon-glass-art" data-finish="star-moon">
    <image className="moon-glass-texture" href={STAR_MOON_GLASS.src}
      width={STAR_MOON_GLASS.width} height={STAR_MOON_GLASS.height}
      transform={STAR_MOON_TRANSFORM} preserveAspectRatio="xMidYMid meet" />
  </g>
}
