import { STAR_MOON_GLASS, STAR_MOON_TRANSFORM } from '../scene/starMoonGlass'
import { CABINET_LIGHTS, GLASS_LIGHTING, GLASS_RESPONSE, localLight, SOFT_GLASS, type GlassPose } from '../scene/glassLighting'

/** Only the glass receives light; the independent liquid and protected gold do not. */
export default function StarMoonGlass({ id, pose }: { id: string; pose: GlassPose }) {
  return <g className="moon-glass-art" data-finish="star-moon" data-lighting={GLASS_LIGHTING}
    data-light-x={pose.x} data-light-y={pose.y} data-light-scale={pose.scale} data-light-angle={pose.angle}>
    <image className="moon-glass-texture" href={GLASS_LIGHTING === 'flat' ? STAR_MOON_GLASS.src : SOFT_GLASS}
      width={STAR_MOON_GLASS.width} height={STAR_MOON_GLASS.height}
      transform={STAR_MOON_TRANSFORM} preserveAspectRatio="xMidYMid meet" />
    {GLASS_LIGHTING === 'ambient' && <>
      <defs>
        <mask id={`${id}-glass-response`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="150" style={{ maskType: 'alpha' }}>
          <image href={GLASS_RESPONSE} width={STAR_MOON_GLASS.width} height={STAR_MOON_GLASS.height} transform={STAR_MOON_TRANSFORM} />
        </mask>
        {CABINET_LIGHTS.map(light => {
          const p = localLight(light, pose)
          return <radialGradient key={light.id} id={`${id}-light-${light.id}`} data-world-light={light.id}
            gradientUnits="userSpaceOnUse" cx={p.x} cy={p.y} r={light.radius / pose.scale}>
            <stop stopColor={light.color} stopOpacity={light.strength} />
            <stop offset=".45" stopColor={light.color} stopOpacity={light.strength * .55} />
            <stop offset="1" stopColor={light.color} stopOpacity="0" />
          </radialGradient>
        })}
      </defs>
      <g className="glass-environment" mask={`url(#${id}-glass-response)`} pointerEvents="none">
        <rect width="100" height="150" fill="#b5a08a" opacity=".055" />
        {CABINET_LIGHTS.map(light => <rect key={light.id} width="100" height="150" fill={`url(#${id}-light-${light.id})`} />)}
      </g>
    </>}
  </g>
}
