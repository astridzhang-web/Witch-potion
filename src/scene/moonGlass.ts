// User artwork coordinates; preserve its natural 1086:1448 ratio and original pixels.
export const MOON_GLASS = {
  src: '/assets/bottles/moon-glass-source.webp',
  width: 1086, height: 1448,
  scale: 124 / (1410 - 52),
  mouth: { x: 543, y: 52 }, contactY: 1410,
  // Hand measured outer glass boundary excludes detached low-alpha matte residue.
  outline: 'M543 23C456 23 382 27 382 49C382 69 446 80 458 148C478 277 479 531 445 622C429 678 385 701 332 735C219 791 164 912 164 1032C164 1151 207 1245 275 1301L365 1393Q543 1428 720 1393L805 1301C878 1230 922 1151 922 1032C922 912 867 791 754 735C701 701 657 678 641 622C607 531 608 277 628 148C640 80 704 69 704 49C704 27 630 23 543 23Z',
  neck: 'M430 52H656L608 115L600 500Q596 639 650 702H436Q490 639 486 500L478 115Z',
} as const
export const MOON_TRANSFORM = `translate(${50 - MOON_GLASS.mouth.x * MOON_GLASS.scale} ${10 - MOON_GLASS.mouth.y * MOON_GLASS.scale}) scale(${MOON_GLASS.scale})`
