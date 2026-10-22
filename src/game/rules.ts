export const CAPACITY = 4
export const BOTTLE_COUNT = 9
export const COLOR_COUNT = 7
export type Color = 0 | 1 | 2 | 3 | 4 | 5 | 6
/** Units are stored bottom to top. No renderer or browser dependencies here. */
export type Bottle = readonly Color[]
export type Board = readonly Bottle[]
export interface Pour {
  readonly from: number
  readonly to: number
  readonly color: Color
  readonly amount: number
  readonly before: Board
  readonly after: Board
}

export function isBoard(value: unknown): value is Board {
  if (!Array.isArray(value) || value.length !== BOTTLE_COUNT) return false
  const counts = Array<number>(COLOR_COUNT).fill(0)
  for (const bottle of value) {
    if (!Array.isArray(bottle) || bottle.length > CAPACITY) return false
    for (const color of bottle) {
      if (!Number.isInteger(color) || color < 0 || color >= COLOR_COUNT) return false
      counts[color]++
    }
  }
  return counts.every((count) => count === CAPACITY)
}

export function isComplete(bottle: Bottle): boolean {
  return bottle.length === CAPACITY && bottle.every((color) => color === bottle[0])
}

export function isVictory(board: Board): boolean {
  return isBoard(board) && board.filter(isComplete).length === COLOR_COUNT &&
    board.filter((bottle) => bottle.length === 0).length === 2
}

/** One atomic transaction. Future animations can render before → after using its metadata. */
export function planPour(board: Board, from: number, to: number): Pour | null {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return null
  const source = board[from]
  const target = board[to]
  if (!source?.length || !target || target.length >= CAPACITY) return null
  const color = source[source.length - 1]
  if (target.length && target[target.length - 1] !== color) return null
  let run = 1
  while (run < source.length && source[source.length - run - 1] === color) run++
  const amount = Math.min(run, CAPACITY - target.length)
  const after = board.map((bottle, index) => index === from
    ? bottle.slice(0, -amount)
    : index === to ? [...bottle, ...source.slice(-amount)] : bottle)
  return { from, to, color, amount, before: board, after }
}

export function hasLegalMove(board: Board): boolean {
  return board.some((_, from) => board.some((_, to) => planPour(board, from, to) !== null))
}

export function boardsEqual(a: Board, b: Board): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
