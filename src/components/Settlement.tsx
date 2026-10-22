import { useEffect, useRef } from 'react'
import Icon from './Icon'

export default function Settlement({ moves, onClose }: { moves: number; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className="settlement" aria-labelledby="settlement-title" aria-describedby="settlement-hint" onClick={onClose} onCancel={event => { event.preventDefault(); onClose() }}>
    <button autoFocus className="icon-button settlement-close" aria-label="收起结算" onClick={event => { event.stopPropagation(); onClose() }}><Icon name="close" /></button>
    <p className="settlement-kicker" aria-hidden="true">✧ MOONLIT ALCHEMY ✧</p>
    <h2 id="settlement-title">调配完成</h2>
    <p className="settlement-moves">本次步数 <strong data-testid="settlement-moves">{moves}</strong></p>
    <svg className="settlement-crystal" viewBox="0 0 240 260" aria-hidden="true">
      <defs>
        <radialGradient id="crystal-aura"><stop stopColor="#9679ed" stopOpacity=".38"/><stop offset="1" stopColor="#7964bc" stopOpacity="0"/></radialGradient>
        <linearGradient id="crystal-main" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d1d9ff"/><stop offset=".45" stopColor="#8e7ce9"/><stop offset="1" stopColor="#514a9f"/></linearGradient>
      </defs>
      <ellipse cx="120" cy="135" rx="108" ry="115" fill="url(#crystal-aura)"/>
      <g className="crystal-gem" stroke="#ded8ff" strokeOpacity=".55" strokeWidth="1">
        <path d="M120 35 161 83 153 165 120 220 87 165 79 83Z" fill="url(#crystal-main)"/>
        <path d="M120 35 109 92 111 165 120 220 137 159 137 89Z" fill="#c7b3ff" fillOpacity=".65"/>
        <path d="M79 83 109 92 111 165 87 165Z" fill="#6552b5"/>
        <path d="M137 89 161 83 153 165 137 159Z" fill="#8fa9ff" fillOpacity=".75"/>
        <path d="M120 35 79 83 109 92Z" fill="#e8e4ff" fillOpacity=".65"/>
        <path d="M111 165 120 220 87 165Z" fill="#524c9e"/>
      </g>
      <g fill="#e8ce90"><path d="m45 101 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z"/><path d="m188 61 2 8 8 2-8 2-2 8-2-8-8-2 8-2Z"/><path d="m179 183 1.5 6 6 1.5-6 1.5-1.5 6-1.5-6-6-1.5 6-1.5Z"/><circle cx="64" cy="187" r="1.5"/><circle cx="175" cy="129" r="1"/></g>
    </svg>
    <p className="settlement-copy">七色各归其位，今夜的魔法已成。</p>
    <p id="settlement-hint">轻触任意位置，欣赏你的调配成果</p>
  </dialog>
}
