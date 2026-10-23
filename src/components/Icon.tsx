export type IconName = 'undo' | 'restart' | 'new' | 'help' | 'check' | 'close' | 'sparkle'
const paths: Record<IconName, string> = {
  undo: 'M9 4 4 9l5 5M4 9h9a6 6 0 0 1 0 12',
  restart: 'M4 9a8 8 0 1 1 0 7M4 4v5h5',
  new: 'M12 4v16M4 12h16',
  help: 'M9.5 8a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.3-1.5 3M12 17h.01',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  sparkle: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z',
}
export default function Icon({ name }: { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'help' && <circle cx="12" cy="12" r="10" />}
    <path d={paths[name]} />
  </svg>
}
