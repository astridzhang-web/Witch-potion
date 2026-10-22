import type { CSSProperties } from 'react'

// Coordinates measured on the unchanged 941 × 1672 reference. Every interactive
// element shares the image's containing block; never independently cover/crop it.
export const CABINET = { width: 941, height: 1672 } as const
export const SHELF_Y = [628, 976, 1324] as const
export const BOTTLE_X = [265, 470.5, 676] as const
export const BOTTLE_SIZE = { width: 200, height: 300 } as const
export const PANELS = {
  undo: { x: 80, y: 1360, width: 230, height: 130 },
  restart: { x: 631, y: 1360, width: 230, height: 130 },
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
