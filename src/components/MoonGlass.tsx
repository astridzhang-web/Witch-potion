import { MOON_GLASS, MOON_TRANSFORM } from '../scene/moonGlass'

/** Original pixels, non-destructive alpha masks; no painted replacement glass. */
export default function MoonGlass({ id, cavity }: { id: string; cavity: string }) {
  return <>
    <defs>
      <mask id={`${id}-glass-alpha`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="150" style={{ maskType: 'luminance' }}>
        <path d={MOON_GLASS.outline} transform={MOON_TRANSFORM} fill="#ddd" />
        <path d={cavity} fill="#707070" />
        <path d={MOON_GLASS.neck} transform={MOON_TRANSFORM} fill="#444" />
      </mask>
      <clipPath id={`${id}-art-outline`}><path d={MOON_GLASS.outline} transform={MOON_TRANSFORM} /></clipPath>
      <filter id={`${id}-warm-detail`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        {/* Restore warm metal/highlights, without restoring the opaque blue-gray neck. */}
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  4 0 -4 0 0" result="warm" />
        <feComposite in="SourceGraphic" in2="warm" operator="in" />
      </filter>
    </defs>
    <g className="moon-glass-art" clipPath={`url(#${id}-art-outline)`}>
      <g mask={`url(#${id}-glass-alpha)`}>
        <image className="moon-glass-texture" href={MOON_GLASS.src} width={MOON_GLASS.width} height={MOON_GLASS.height} transform={MOON_TRANSFORM} preserveAspectRatio="xMidYMid meet" />
      </g>
      <g filter={`url(#${id}-warm-detail)`}>
        <image href={MOON_GLASS.src} width={MOON_GLASS.width} height={MOON_GLASS.height} transform={MOON_TRANSFORM} preserveAspectRatio="xMidYMid meet" />
      </g>
    </g>
  </>
}
