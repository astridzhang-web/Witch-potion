import { useEffect, useRef } from 'react'
import Icon from './Icon'
import CrystalDisplay from './CrystalDisplay'

function ScrollIcon() {
  return <svg className="scroll-icon" viewBox="0 0 44 48" aria-hidden="true">
    <defs><linearGradient id="scroll-paper" x2="1" y2="1"><stop stopColor="#f9e1ab"/><stop offset=".5" stopColor="#dab27c"/><stop offset="1" stopColor="#f6d79b"/></linearGradient></defs>
    <g transform="rotate(-12 22 24)" stroke="#89603a" strokeWidth="1.1" strokeLinejoin="round">
      <path d="M8 9h26v29H10Z" fill="url(#scroll-paper)"/>
      <path d="M8 5h26q6 0 4 7H8C2 12 2 5 8 5Z M10 35h25q6 0 3 8H10c-7 0-7-8 0-8Z" fill="url(#scroll-paper)"/>
      <ellipse cx="8" cy="8.5" rx="2.6" ry="3.5" fill="#a87e4c"/><ellipse cx="10" cy="39" rx="2.6" ry="4" fill="#ac8354"/>
      <path d="M25 19a5 5 0 1 0 0 10 6 6 0 0 1 0-10" fill="#9a703b" stroke="none"/>
      <path d="M14 30h12" opacity=".4"/><path d="m28 12 1 8 3-2 3 1-1-7" fill="#80608f" stroke="#61456b" strokeWidth=".6"/>
    </g>
  </svg>
}
export default function Settlement({ moves, award, completionDelta, onClose }: { moves: number; award: 0 | 1 | 2; completionDelta: 0 | 1; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className="settlement" aria-labelledby="settlement-title" aria-describedby="settlement-hint" onClick={onClose} onCancel={event => { event.preventDefault(); onClose() }}>
    <button autoFocus className="icon-button settlement-close" aria-label="收起结算" onClick={event => { event.stopPropagation(); onClose() }}><Icon name="close" /></button>
    <div className="parchment">
      <div className="parchment-content">
        <h2 id="settlement-title">调配完成</h2>
        <div className="record-divider" aria-hidden="true">✧</div>
        <p className="settlement-moves">本次步数 <strong data-testid="settlement-moves">{moves}</strong></p>
        <CrystalDisplay count={award} />
        <p className="crystal-reward">晶石奖励 <strong data-testid="crystal-award">+{award}</strong></p>
        <p className="completion-receipt"><ScrollIcon/><span>已完成谜题</span><strong data-testid="completion-delta">{completionDelta ? '+1' : '已记录'}</strong></p>
        <div className="record-divider" aria-hidden="true">☾</div>
        <p className="settlement-copy">今夜的调配已收入月夜手记。</p>
      </div>
    </div>
    <p id="settlement-hint">轻触任意位置关闭 · Esc 返回</p>
  </dialog>
}
