import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BottleArt, COLORS } from './Bottle'
import type { Pour } from '../game/rules'
import type { Session } from '../game/session'
import { BOTTLE_GEOMETRY, MOUTH, bottleAppearance, liquidSurfaces, pouringAngle, rotate } from '../scene/bottleGeometry'

interface ArtBox { x: number; y: number; width: number; height: number; restY: number }
export interface Flight {
  pour: Pour
  session: Session
  source: ArtBox
  target: ArtBox
}

/** Measure the actual SVG drawing, including its centered viewBox and selected lift. */
export function measureBottle(index: number): ArtBox | null {
  const svg = document.querySelector<SVGSVGElement>(`[data-testid="bottle-${index}"] .bottle-art`)
  const matrix = svg?.getScreenCTM()
  if (!matrix || matrix.a <= 0) return null
  const transform = getComputedStyle(svg!).transform
  const lift = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42
  return { x: matrix.e, y: matrix.f, restY: matrix.f - lift, width: 100 * matrix.a, height: 150 * matrix.d }
}

const ARRIVE = 260
const POURED = 640
const DURATION = 920
const clamp = (n: number) => Math.max(0, Math.min(1, n))
const ease = (n: number) => n * n * (3 - 2 * n)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function PourAnimation({ flight, onCommit, onFinish }: {
  flight: Flight
  onCommit(session: Session): void
  onFinish(): void
}) {
  const id = useId().replace(/:/g, '')
  const [elapsed, setElapsed] = useState(0)
  const committed = useRef(false)
  const { pour, source, target } = flight

  useEffect(() => {
    let raf = 0
    let ended = false
    const started = performance.now()
    const commit = () => {
      if (!committed.current) {
        committed.current = true
        onCommit(flight.session)
      }
    }
    const finish = () => {
      if (ended) return
      ended = true
      cancelAnimationFrame(raf)
      commit()
      onFinish()
    }
    const tick = (now: number) => {
      if (ended) return
      const time = now - started
      if (time >= POURED) commit()
      if (time >= DURATION) { finish(); return }
      setElapsed(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Finish atomically if geometry becomes stale or rAF is suspended. Never depend on animationend.
    const fallback = window.setTimeout(finish, DURATION + 200)
    const visibility = () => { if (document.hidden) finish() }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reduced = () => { if (motion.matches) finish() }
    window.addEventListener('resize', finish)
    window.addEventListener('scroll', finish, true)
    document.addEventListener('visibilitychange', visibility)
    motion.addEventListener('change', reduced)
    return () => {
      ended = true
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
      window.removeEventListener('resize', finish)
      window.removeEventListener('scroll', finish, true)
      document.removeEventListener('visibilitychange', visibility)
      motion.removeEventListener('change', reduced)
    }
  }, [flight, onCommit, onFinish])

  const progress = clamp((elapsed - ARRIVE) / (POURED - ARRIVE))
  const returning = elapsed >= POURED
  const phase = elapsed < ARRIVE ? 'lift' : returning ? 'return' : 'pour'
  // Pour inward at screen edges so the tilted body stays on-screen even across rows.
  const direction = target.x + target.width / 2 < window.innerWidth / 2 ? -1 : 1
  const sourceKind = bottleAppearance(pour.from), targetKind = bottleAppearance(pour.to)
  const sourceLevel = pour.before[pour.from].length - pour.amount * progress
  const targetLevel = pour.before[pour.to].length + pour.amount * progress
  const travel = ease(clamp(elapsed / ARRIVE))
  const back = ease(clamp((elapsed - POURED) / (DURATION - POURED)))
  const angle = direction * (returning ? pouringAngle(sourceKind, pour.after[pour.from].length) * (1 - back)
    : pouringAngle(sourceKind, sourceLevel) * travel)
  const sourceScale = source.width / 100, targetScale = target.width / 100
  const mouth = { x: target.x + MOUTH.x * targetScale, y: target.y + MOUTH.y * targetScale }
  const tip = { x: mouth.x - direction * 12, y: mouth.y - 22 }
  const lip = rotate({ x: MOUTH.x + direction * BOTTLE_GEOMETRY[sourceKind].mouthRadius, y: MOUTH.y }, angle)
  // Position the actual downhill rim at the stream origin, not the old SVG origin.
  const near = { x: tip.x - lip.x * sourceScale, y: tip.y - lip.y * sourceScale }
  const x = returning ? lerp(near.x, source.x, back) : lerp(source.x, near.x, travel)
  const y = returning ? lerp(near.y, source.restY, back) : lerp(source.y, near.y, travel) - Math.sin(travel * Math.PI) * 16
  const surface = liquidSurfaces(targetKind, 0, [targetLevel])[0]
  const color = COLORS[pour.color]

  return createPortal(<div className="pour-overlay" data-testid="pour-animation" data-phase={phase} data-from={pour.from} data-to={pour.to} aria-hidden="true">
    <div className="receiving-sprite" style={{ left: target.x, top: target.y, width: target.width, height: target.height }}>
      <BottleArt liquid={pour.after[pour.to]} kind={targetKind} fillLevel={targetLevel} receivingColor={targetKind === 'moon-glass' && phase === 'pour' ? pour.color : undefined} />
    </div>
    <div className="flying-bottle" style={{ width: source.width, height: source.height, transform: `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)` }}>
      <BottleArt liquid={pour.before[pour.from]} kind={sourceKind} fillLevel={sourceLevel} angle={angle} pouring={phase === 'pour'} />
    </div>
    {phase === 'pour' && <svg className="potion-stream" width="100%" height="100%" data-color={pour.color}>
      <path d={`M${tip.x} ${tip.y} Q${mouth.x} ${tip.y + 3} ${mouth.x} ${mouth.y + 4}`} stroke={color.main} strokeWidth={Math.min(3.2, targetScale * 4)} opacity=".92" fill="none" strokeLinecap="round" />
      <path d={`M${tip.x} ${tip.y} Q${mouth.x} ${tip.y + 3} ${mouth.x} ${mouth.y + 4}`} stroke={color.light} strokeWidth={targetScale * 1.3} opacity=".8" fill="none" strokeLinecap="round" />
      <defs><clipPath id={`${id}-receiver`}><path d={BOTTLE_GEOMETRY[targetKind].clip} /></clipPath></defs>
      {targetKind !== 'moon-glass' && <g transform={`translate(${target.x} ${target.y}) scale(${targetScale})`} clipPath={`url(#${id}-receiver)`}>
        <path className="receiving-flow" d={`M50 10V${surface}`} stroke={color.light} strokeWidth="1.8" opacity=".6" />
        <ellipse cx="50" cy={surface} rx="12" ry="1.3" fill="none" stroke={color.light} strokeWidth=".9" opacity=".65" />
      </g>}
    </svg>}
  </div>, document.body)
}
