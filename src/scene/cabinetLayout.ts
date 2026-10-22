import type { CSSProperties } from 'react'

// Coordinates measured on the unchanged 841 × 1870 tall reference.
// See assets/cabinet-tall-layout.md for the independently measured artwork bands.
// Each element shares the image's containing block; never independently cover/crop it.
export const CABINET = { width: 841, height: 1870 } as const
export const SHELF_Y = [668, 1088, 1500] as const
export const BOTTLE_X = [250, 420.5, 591] as const
export const BOTTLE_SIZE = { width: 170, height: 255 } as const
export const CENTER_PANEL = { x: 300, y: 1540, width: 241, height: 138 } as const
export const PANELS = {
  undo: { x: 77, y: 1542, width: 200, height: 132 },
  restart: { x: 564, y: 1542, width: 200, height: 132 },
} as const

interface Box { x: number; y: number; width: number; height: number }
export function imagePosition(box: Box): CSSProperties {
  return {
    left: `${box.x / CABINET.width * 100}%`,
    top: `${box.y / CABINET.height * 100}%`,
    width: `${box.width / CABINET.width * 100}%`,
    height: `${box.height / CABINET.height * 100}%`,
  }
}
export function bottlePosition(index: number): CSSProperties {
  // The glass's contact point is y=134 in the existing 100×150 SVG viewBox.
  return imagePosition({
    x: BOTTLE_X[index % 3] - BOTTLE_SIZE.width / 2,
    y: SHELF_Y[Math.floor(index / 3)] - BOTTLE_SIZE.height * 134 / 150,
    ...BOTTLE_SIZE,
  })
}

export function panelPosition(name: keyof typeof PANELS): CSSProperties {
  const box = PANELS[name]
  // Center anchoring lets a 44px minimum hit height grow symmetrically on short screens.
  return imagePosition({ ...box, y: box.y + box.height / 2 })
}
