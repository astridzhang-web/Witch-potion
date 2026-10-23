/** Art-only capacity for a future third crystal; the reward rules currently cap at two. */
export default function CrystalDisplay({ count }: { count: 0 | 1 | 2 | 3 }) {
  return <div className="settlement-crystal" data-testid="crystal-display" data-count={count} aria-hidden="true">
    <svg className="astrolabe" viewBox="0 0 240 240">
      <g fill="none" stroke="currentColor">
        <circle cx="120" cy="120" r="94" strokeWidth=".8"/><circle cx="120" cy="120" r="89" strokeWidth=".5"/>
        <circle cx="120" cy="120" r="66" strokeWidth=".45" strokeDasharray="1 5"/>
        {Array.from({length: 24}, (_, i) => <path key={i} d="M120 27V37 M120 48V192" transform={`rotate(${i * 15} 120 120)`} strokeWidth=".35" opacity={i % 3 ? '.35' : '.65'}/>)}
        <path d="m120 29 52 143H68Z M120 211 52 68h136Z" strokeWidth=".4" opacity=".5"/>
      </g>
      <g fill="currentColor"><path d="M25 104a16 16 0 1 0 0 32 18 18 0 0 1 0-32 M215 104a16 16 0 1 1 0 32 18 18 0 0 0 0-32"/>
        <path d="m120 18 2 8 6 2-6 2-2 8-2-8-6-2 6-2Z m0 184 2 8 6 2-6 2-2 8-2-8-6-2 6-2Z"/>
      </g>
    </svg>
    <div className="crystal-group">
      {Array.from({ length: count }, (_, i) => <img key={i} className="reward-crystal" src="/assets/settlement/amethyst.webp" width="384" height="576" alt="" draggable={false} />)}
    </div>
  </div>
}
