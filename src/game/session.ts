import { type Board, type Pour, isVictory, planPour } from './rules'
import type { Puzzle } from './puzzles'

export interface Session {
  puzzle: Puzzle
  board: Board
  history: readonly Board[]
}
export const createSession = (puzzle: Puzzle): Session => ({ puzzle, board: puzzle.initial, history: [] })
export function pourSession(session: Session, from: number, to: number): { session: Session; pour: Pour } | null {
  if (isVictory(session.board)) return null
  const pour = planPour(session.board, from, to)
  return pour ? {
    session: { ...session, board: pour.after, history: [...session.history, session.board] }, pour,
  } : null
}
export function undo(session: Session): Session {
  if (!session.history.length) return session
  return { ...session, board: session.history[session.history.length - 1], history: session.history.slice(0, -1) }
}
export const restart = (session: Session): Session => createSession(session.puzzle)
