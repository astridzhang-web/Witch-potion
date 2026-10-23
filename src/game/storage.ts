import { boardsEqual, isBoard, isVictory, planPour, type Board } from './rules'
import { isVerifiedPuzzle } from './puzzles'
import { migrateLegacy, isCompletion, isRewards, type Save } from './progress'
export type { Save } from './progress'

export const SAVE_KEY = 'moonlit-alchemy.save.v1'
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

function isLegalSuccessor(before: Board, after: Board): boolean {
  if (isVictory(before)) return false
  const changed = before.map((bottle, i) => JSON.stringify(bottle) === JSON.stringify(after[i]) ? -1 : i).filter((i) => i >= 0)
  if (changed.length !== 2) return false
  const from = changed.find((i) => before[i].length > after[i].length)
  const to = changed.find((i) => before[i].length < after[i].length)
  if (from === undefined || to === undefined) return false
  const pour = planPour(before, from, to)
  return pour !== null && boardsEqual(pour.after, after)
}

/** Corrupt/unsupported saves never become active game state. Every undo step is validated. */
export function decodeSave(raw: string | null): Save | null {
  if (!raw || raw.length > 2_000_000) return null
  try {
    const value = JSON.parse(raw)
    if (![1, 2, 3].includes(value?.version) || typeof value.showSymbols !== 'boolean') return null
    const session = value.session
    if (!session || !isVerifiedPuzzle(session.puzzle) || !isBoard(session.board) ||
      !Array.isArray(session.history) || session.history.length > 5_000 || !session.history.every(isBoard)) return null
    const chain: Board[] = [...session.history, session.board]
    if (!boardsEqual(chain[0], session.puzzle.initial)) return null
    if (chain.some((board, i) => i > 0 && !isLegalSuccessor(chain[i - 1], board))) return null
    if (value.version === 1) return migrateLegacy(session, value.showSymbols)
    if (!isCompletion(value.completion) || (isVictory(session.board) && !value.completion.currentPuzzleCounted)) return null
    if (value.version === 2) return migrateLegacy(session, value.showSymbols, value.completion)
    if (!isRewards(value.rewards, value.completion, session)) return null
    return { session, showSymbols: value.showSymbols, completion: value.completion, rewards: value.rewards }
  } catch { return null }
}

export function loadSave(storage: StorageLike): Save | null {
  try { return decodeSave(storage.getItem(SAVE_KEY)) } catch { return null }
}
export function saveProgress(storage: StorageLike, save: Save): boolean {
  try {
    // Keep the write and read limits consistent; never report an unrestorable save as saved.
    const raw = JSON.stringify({ ...save, version: 3 })
    if (save.session.history.length > 5_000 || raw.length > 2_000_000) return false
    storage.setItem(SAVE_KEY, raw)
    return true
  } catch { return false }
}
