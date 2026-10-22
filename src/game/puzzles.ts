import data from './presets.json'
import { type Board, type Color, isBoard } from './rules'

export interface Preset {
  id: string
  board: Board
  solution: readonly (readonly [number, number])[]
}
export const PRESETS = data as unknown as readonly Preset[]
export interface Puzzle {
  presetId: string
  initial: Board
}

/** A bijective color relabeling preserves every legal move and the solution witness. */
export function createPuzzle(index = 0, random = Math.random): Puzzle {
  const preset = PRESETS[((index % PRESETS.length) + PRESETS.length) % PRESETS.length]
  const colors: Color[] = [0, 1, 2, 3, 4, 5, 6]
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[colors[i], colors[j]] = [colors[j], colors[i]]
  }
  return { presetId: preset.id, initial: preset.board.map((bottle) => bottle.map((c) => colors[c])) }
}

export function nextPuzzle(currentId: string): Puzzle {
  return createPuzzle(PRESETS.findIndex((preset) => preset.id === currentId) + 1)
}

/** Accept saved starting boards only when they are relabelings of a proven preset. */
export function isVerifiedPuzzle(value: unknown): value is Puzzle {
  if (!value || typeof value !== 'object') return false
  const puzzle = value as Partial<Puzzle>
  const preset = PRESETS.find((item) => item.id === puzzle.presetId)
  if (!preset || !isBoard(puzzle.initial)) return false
  const mapping = new Map<Color, Color>()
  for (let i = 0; i < preset.board.length; i++) {
    if (preset.board[i].length !== puzzle.initial[i].length) return false
    for (let j = 0; j < preset.board[i].length; j++) {
      const from = preset.board[i][j]
      const to = puzzle.initial[i][j]
      if (mapping.has(from) && mapping.get(from) !== to) return false
      mapping.set(from, to)
    }
  }
  return new Set(mapping.values()).size === 7
}
