import { isVictory } from './rules'
import { createSession, type Session } from './session'
import type { Puzzle } from './puzzles'

export interface Completion {
  totalCompleted: number
  currentPuzzleCounted: boolean
  settlementDismissed: boolean
}
export interface Save { session: Session; showSymbols: boolean; completion: Completion }
export function createGame(session: Session, showSymbols = false): Save {
  return withSession({ session, showSymbols, completion: { totalCompleted: 0, currentPuzzleCounted: false, settlementDismissed: false } }, session)
}

/** One atomic board + lifetime-count transaction; undo/restart never clear the current-puzzle marker. */
export function withSession(game: Save, session: Session): Save {
  if (!game.completion.currentPuzzleCounted && isVictory(session.board)) {
    return { ...game, session, completion: {
      totalCompleted: Math.min(Number.MAX_SAFE_INTEGER, game.completion.totalCompleted + 1),
      currentPuzzleCounted: true, settlementDismissed: false,
    } }
  }
  return { ...game, session }
}
export function settlementPending(game: Save): boolean {
  return isVictory(game.session.board) && game.completion.currentPuzzleCounted && !game.completion.settlementDismissed
}
export function dismissSettlement(game: Save): Save {
  return settlementPending(game) ? { ...game, completion: { ...game.completion, settlementDismissed: true } } : game
}
export function startNewPuzzle(game: Save, puzzle: Puzzle): Save {
  // A queued second click sees the new mixed board and cannot start another puzzle.
  if (!isVictory(game.session.board) || !game.completion.settlementDismissed) return game
  return { ...game, session: createSession(puzzle), completion: {
    ...game.completion, currentPuzzleCounted: false, settlementDismissed: false,
  } }
}
export function isCompletion(value: unknown): value is Completion {
  if (!value || typeof value !== 'object') return false
  const c = value as Completion
  return Number.isSafeInteger(c.totalCompleted) && c.totalCompleted >= 0 &&
    typeof c.currentPuzzleCounted === 'boolean' && typeof c.settlementDismissed === 'boolean' &&
    (!c.currentPuzzleCounted || c.totalCompleted > 0) && (!c.settlementDismissed || c.currentPuzzleCounted)
}
