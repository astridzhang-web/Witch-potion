import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CENTER_PANEL, imagePosition } from '../scene/cabinetLayout'
import PanelMagic from './PanelMagic'

const FLIP_MS = 650

export default function CenterPanel({ revealed, blocked, onNew }: { revealed: boolean; blocked: boolean; onNew(): void }) {
  const [ready, setReady] = useState(revealed)
  const [turning, setTurning] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const previous = useRef(revealed)
  useEffect(() => {
    if (previous.current === revealed) return
    previous.current = revealed
    setReady(false)
    setTurning(true)
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => { setReady(revealed); setTurning(false) }
    if (motion.matches) { finish(); return }
    const timer = window.setTimeout(finish, FLIP_MS)
    const onMotion = () => { if (motion.matches) finish() }
    motion.addEventListener('change', onMotion)
    return () => { clearTimeout(timer); motion.removeEventListener('change', onMotion) }
  }, [revealed])
  useEffect(() => {
    if (ready && revealed && !blocked) button.current?.focus({ preventScroll: true })
  }, [ready, revealed, blocked])
  return <div className={`center-panel ${revealed ? 'is-revealed' : ''}`} style={{ ...imagePosition(CENTER_PANEL), '--flip-duration': `${FLIP_MS}ms` } as CSSProperties} data-testid="center-panel" data-face={revealed ? 'back' : 'star'} data-ready={ready && revealed} data-turning={turning}>
    <div className="panel-rotor">
      <div className="panel-edge panel-edge-top" aria-hidden="true" />
      <div className="panel-edge panel-edge-bottom" aria-hidden="true" />
      <div className="panel-edge panel-edge-left" aria-hidden="true" />
      <div className="panel-edge panel-edge-right" aria-hidden="true" />
      <div className="panel-face panel-front" aria-hidden="true" />
      <div className="panel-face panel-back">
        <button ref={button} type="button" className="new-puzzle-panel" aria-hidden={!revealed} tabIndex={revealed && ready ? 0 : -1} disabled={!revealed || !ready || blocked} onClick={onNew}>
          <PanelMagic />
          <span className="panel-star" aria-hidden="true">✧</span><span className="panel-label">新谜题</span><span className="panel-star" aria-hidden="true">✧</span>
        </button>
      </div>
    </div>
  </div>
}
