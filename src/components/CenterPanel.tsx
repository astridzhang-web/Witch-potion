import { useEffect, useRef, useState } from 'react'
import { CENTER_PANEL, imagePosition } from '../scene/cabinetLayout'

export default function CenterPanel({ revealed, blocked, onNew }: { revealed: boolean; blocked: boolean; onNew(): void }) {
  const [ready, setReady] = useState(revealed)
  const button = useRef<HTMLButtonElement>(null)
  const previous = useRef(revealed)
  useEffect(() => {
    if (previous.current === revealed) return
    previous.current = revealed
    setReady(false)
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => setReady(revealed)
    if (motion.matches) { finish(); return }
    const timer = window.setTimeout(finish, 550)
    const onMotion = () => { if (motion.matches) finish() }
    motion.addEventListener('change', onMotion)
    return () => { clearTimeout(timer); motion.removeEventListener('change', onMotion) }
  }, [revealed])
  useEffect(() => {
    if (ready && revealed && !blocked) button.current?.focus({ preventScroll: true })
  }, [ready, revealed, blocked])
  return <div className={`center-panel ${revealed ? 'is-revealed' : ''}`} style={imagePosition(CENTER_PANEL)} data-testid="center-panel" data-face={revealed ? 'back' : 'star'} data-ready={ready && revealed}>
    <div className="panel-rotor">
      <div className="panel-face panel-front" aria-hidden="true" />
      <div className="panel-face panel-back">
        <button ref={button} type="button" className="new-puzzle-panel" aria-hidden={!revealed} tabIndex={revealed && ready ? 0 : -1} disabled={!revealed || !ready || blocked} onClick={onNew}>
          <span aria-hidden="true">✧</span><span>新谜题</span><span aria-hidden="true">✧</span>
        </button>
      </div>
    </div>
  </div>
}
