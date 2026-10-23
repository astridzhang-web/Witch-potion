import { useId, type CSSProperties } from 'react'
import { isComplete, type Bottle as BottleState } from '../game/rules'

export const COLORS = [
  { name: '玫瑰红', light: '#ff8394', main: '#dc4269', dark: '#9b274b' },
  { name: '紫水晶', light: '#bea0f8', main: '#8b64d5', dark: '#5c379e' },
  { name: '薄荷绿', light: '#acedd0', main: '#53c99d', dark: '#25886b' },
  { name: '天空蓝', light: '#9eddfa', main: '#53b7e8', dark: '#287eab' },
  { name: '蜂蜜金', light: '#ffe9a0', main: '#eac25e', dark: '#b98b2c' },
  { name: '珊瑚橙', light: '#ffc0a0', main: '#f28a60', dark: '#b95537' },
  { name: '兰花粉', light: '#f7b1f1', main: '#dc71d8', dark: '#a142a0' },
] as const

const silhouette = 'M39 15 L39 41 C39 51 20 52 18 75 L16 109 Q15 133 39 134 L61 134 Q85 133 84 109 L82 75 C80 52 61 51 61 41 L61 15 Z'

interface Props {
  liquid: BottleState
  style?: CSSProperties
  index: number
  selected: boolean
  won: boolean
  busy?: boolean
  animating?: boolean
  receiving?: boolean
  onClick(): void
}
export default function Bottle({ liquid, index, selected, won, busy, animating, receiving, style, onClick }: Props) {
  const complete = isComplete(liquid)
  const contents = liquid.length ? `从上到下：${[...liquid].reverse().map((c) => COLORS[c].name).join('、')}` : '空瓶'
  return <button
    className={`bottle ${selected ? 'is-selected' : ''} ${complete ? 'is-complete' : ''} ${animating ? 'is-animating' : ''} ${receiving ? 'is-receiving' : ''}`}
    style={style}
    type="button"
    data-testid={`bottle-${index}`}
    data-liquid={liquid.join(',')}
    aria-label={`药瓶 ${index + 1}，${contents}${complete ? '，已完成' : ''}`}
    aria-pressed={selected}
    disabled={won || busy}
    onClick={onClick}
  >
    <span className="bottle-halo" />
    <span className="bottle-contact-shadow" aria-hidden="true" />
    <BottleArt liquid={liquid} />
    <span className="bottle-number">{complete ? <span aria-hidden="true">✓</span> : String(index + 1).padStart(2, '0')}{liquid.length === 0 && <span className="empty-label">空瓶</span>}</span>
  </button>
}

/** Shared art for stationary bottles and the two animation sprites. Fractional levels are visual only. */
export function BottleArt({ liquid, fillLevel = liquid.length }: { liquid: BottleState; fillLevel?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className="bottle-art" viewBox="0 0 100 150" aria-hidden="true" data-fill-level={fillLevel}>
      <defs>
        <clipPath id={`${id}-level`}><rect x="0" y={130 - fillLevel * 18} width="100" height={fillLevel * 18 + 5} /></clipPath>
        <clipPath id={`${id}-clip`}><path d={silhouette} /></clipPath>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop stopColor="#cbe4ef" stopOpacity=".13" /><stop offset=".3" stopColor="#cbe4ef" stopOpacity=".025" />
          <stop offset=".8" stopColor="#cbe4ef" stopOpacity=".04" /><stop offset="1" stopColor="#cbe4ef" stopOpacity=".16" />
        </linearGradient>
        {COLORS.map((color, i) => <linearGradient key={i} id={`${id}-color-${i}`} x1="0" x2="1">
          <stop stopColor={color.dark} /><stop offset=".25" stopColor={color.main} />
          <stop offset=".65" stopColor={color.light} /><stop offset="1" stopColor={color.main} />
        </linearGradient>)}
      </defs>
      <path d={silhouette} fill={`url(#${id}-glass)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <g clipPath={`url(#${id}-level)`}>
        {liquid.map((color, i) => <g key={i}>
          <rect x="15" y={130 - (i + 1) * 18} width="70" height="18.5" fill={`url(#${id}-color-${color})`} />
          <path d={`M17 ${130 - (i + 1) * 18} Q50 ${134 - (i + 1) * 18} 83 ${130 - (i + 1) * 18}`} fill="none" stroke={COLORS[color].light} strokeWidth="1.4" opacity=".75" />
        </g>)}
        </g>
        {fillLevel > 0 && <ellipse cx="50" cy={130 - fillLevel * 18} rx="34" ry="2.4" fill={COLORS[liquid[Math.min(liquid.length - 1, Math.ceil(fillLevel) - 1)]].light} fillOpacity=".6" />}
      </g>
      <path d={silhouette} fill="none" stroke="#c3d5de" strokeOpacity=".48" strokeWidth="1.2" />
      <path d="M34 57 Q25 65 25 82 L24 107 Q24 120 31 124" fill="none" stroke="#f1f8ff" strokeWidth="3" strokeOpacity=".26" strokeLinecap="round" />
      <path d="M73 77 75 108 Q76 120 68 125M43 21v22" fill="none" stroke="#f1f8ff" strokeWidth="1.5" strokeOpacity=".27" strokeLinecap="round" />
      <ellipse cx="50" cy="15" rx="12" ry="3.6" fill="#182334" stroke="#b6cbd5" strokeOpacity=".65" strokeWidth="1.2" />
      <ellipse cx="50" cy="15" rx="8.5" ry="1.6" fill="#090e1b" />
    </svg>
  )
}
