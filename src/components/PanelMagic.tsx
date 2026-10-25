import type { CSSProperties } from 'react'

// Measured on panel-back.webp (208×138). Curved corners follow the inset brass,
// not the rectangular crop. Every glow pass and every emitter shares this contour.
const outline = 'M39 23H165Q166 30 171 34L179 42Q185 43 185 46V89Q176 92 170 100Q166 104 165 110H40Q38 102 31 97L23 92Q19 91 19 88V46Q20 43 27 40L35 31Q38 28 39 23Z'
const contour = [[39,23],[165,23],[171,34],[185,46],[185,89],[170,100],[165,110],[40,110],[31,97],[19,88],[19,46],[35,31]]
const edges = contour.map((a, i) => {
  const b = contour[(i + 1) % contour.length]
  return { a, b, length: Math.hypot(b[0] - a[0], b[1] - a[1]) }
})
const perimeter = edges.reduce((sum, edge) => sum + edge.length, 0)
// Fixed deterministic seeds, computed once at module load: no render-time randomness,
// timers, RAF, or React updates. Different phases prevent a synchronized pulse.
const particles = Array.from({ length: 36 }, (_, i) => {
  const seed = (i * 73 % 101) / 101
  let along = ((i * .61803398875 + seed * .019) % 1) * perimeter
  let edge = edges[0]
  for (const candidate of edges) {
    edge = candidate
    if (along <= edge.length) break
    along -= edge.length
  }
  const t = along / edge.length
  const x = edge.a[0] + (edge.b[0] - edge.a[0]) * t
  const y = edge.a[1] + (edge.b[1] - edge.a[1]) * t
  const nx = (edge.b[1] - edge.a[1]) / edge.length
  const ny = -(edge.b[0] - edge.a[0]) / edge.length
  return { x, y, star: i % 9 === 0, radius: (.8 + seed * .65) * 1.65, style: {
    '--drift-x': `${nx * (9 + seed * 12) + (seed - .5) * 7}px`,
    '--drift-y': `${ny * (8 + seed * 12) - 3}px`,
    '--life': `${1.8 + seed * 1.2}s`, '--phase': `${-i * .371}s`,
    '--peak': .65 + seed * .35,
  } as CSSProperties }
})

export default function PanelMagic() {
  return <>
    <svg className="panel-brass-glow" viewBox="0 0 208 138" preserveAspectRatio="none" aria-hidden="true">
      <path className="brass-halo" d={outline} />
      <path className="brass-body" d={outline} />
      <path className="brass-highlight" d={outline} />
    </svg>
    <svg className="panel-stardust" viewBox="0 0 208 138" preserveAspectRatio="none" aria-hidden="true">
      {particles.map((p, i) => <g key={i} transform={`translate(${p.x} ${p.y})`}>
        <g className="magic-mote" style={p.style}>
          {p.star ? <path transform="scale(1.6)" d="M0-2.2 .55-.55 2.2 0 .55.55 0 2.2-.55.55-2.2 0-.55-.55Z" /> : <circle r={p.radius} />}
        </g>
      </g>)}
    </svg>
  </>
}
