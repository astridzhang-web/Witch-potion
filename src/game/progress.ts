import { isVictory } from './rules'
import { createSession, type Session } from './session'
import { PRESETS, type Puzzle } from './puzzles'

export interface Completion {
  totalCompleted: number
  currentPuzzleCounted: boolean
  settlementDismissed: boolean
}
export interface Rewards {
  balance: number
  baseClaimed: boolean
  bonusClaimed: boolean
  /** Receipt for the pending/current settlement, not lifetime or per-puzzle earnings. */
  lastAward: 0 | 1 | 2
  completionDelta: 0 | 1
}
export interface Save { session: Session; showSymbols: boolean; completion: Completion; rewards: Rewards }
const emptyRewards = (): Rewards => ({ balance: 0, baseClaimed: false, bonusClaimed: false, lastAward: 0, completionDelta: 0 })
export function referenceMoves(puzzle: Puzzle): number {
  return PRESETS.find(preset => preset.id === puzzle.presetId)!.solution.length
}
export function createGame(session: Session, showSymbols = false): Save {
  return withSession({ session, showSymbols, completion: { totalCompleted: 0, currentPuzzleCounted: false, settlementDismissed: false }, rewards: emptyRewards() }, session)
}

/** One transaction for the board, independent completion credit, and unclaimed rewards. */
export function withSession(game: Save, session: Session): Save {
  if (!isVictory(session.board)) {
    return { ...game, session, rewards: { ...game.rewards, lastAward: 0, completionDelta: 0 } }
  }
  const first = !game.completion.currentPuzzleCounted
  const base = !game.rewards.baseClaimed
  const bonus = !game.rewards.bonusClaimed && session.history.length <= referenceMoves(session.puzzle)
  const award = Number(base) + Number(bonus) as 0 | 1 | 2
  if (!first && !award) return { ...game, session }
  return { ...game, session, completion: {
    totalCompleted: game.completion.totalCompleted + Number(first),
    currentPuzzleCounted: true, settlementDismissed: false,
  }, rewards: {
    balance: game.rewards.balance + award,
    baseClaimed: true, bonusClaimed: game.rewards.bonusClaimed || bonus,
    lastAward: award, completionDelta: first ? 1 : 0,
  } }
}

/** No retrospective crystals. A legacy completed instance's base is retired; its
 * benchmark bonus remains available on a future successful replay. No modal is reopened. */
export function migrateLegacy(session: Session, showSymbols: boolean, completion?: Completion): Save {
  const counted = isVictory(session.board)
  const prior = completion ?? { totalCompleted: Number(counted), currentPuzzleCounted: counted, settlementDismissed: false }
  return { session, showSymbols, completion: prior, rewards: { ...emptyRewards(), baseClaimed: prior.currentPuzzleCounted } }
}
export function settlementPending(game: Save): boolean {
  return isVictory(game.session.board) && game.completion.currentPuzzleCounted && !game.completion.settlementDismissed
}
export function dismissSettlement(game: Save): Save {
  return settlementPending(game) ? { ...game, completion: { ...game.completion, settlementDismissed: true } } : game
}
export function startNewPuzzle(game: Save, puzzle: Puzzle): Save {
  if (!isVictory(game.session.board) || !game.completion.settlementDismissed) return game
  return { ...game, session: createSession(puzzle), completion: {
    ...game.completion, currentPuzzleCounted: false, settlementDismissed: false,
  }, rewards: { ...emptyRewards(), balance: game.rewards.balance } }
}
export function isCompletion(value: unknown): value is Completion {
  if (!value || typeof value !== 'object') return false
  const c = value as Completion
  return Number.isSafeInteger(c.totalCompleted) && c.totalCompleted >= 0 && c.totalCompleted <= Number.MAX_SAFE_INTEGER - 1 &&
    typeof c.currentPuzzleCounted === 'boolean' && typeof c.settlementDismissed === 'boolean' &&
    (!c.currentPuzzleCounted || c.totalCompleted > 0) && (!c.settlementDismissed || c.currentPuzzleCounted)
}
export function isRewards(value: unknown, completion: Completion, session: Session): value is Rewards {
  if (!value || typeof value !== 'object') return false
  const r = value as Rewards
  return Number.isSafeInteger(r.balance) && r.balance >= 0 && r.balance <= Number.MAX_SAFE_INTEGER - 2 &&
    typeof r.baseClaimed === 'boolean' && typeof r.bonusClaimed === 'boolean' &&
    [0, 1, 2].includes(r.lastAward) && [0, 1].includes(r.completionDelta) &&
    r.baseClaimed === completion.currentPuzzleCounted && (!r.bonusClaimed || r.baseClaimed) &&
    r.lastAward <= r.balance && r.completionDelta <= r.lastAward && (!r.bonusClaimed || r.balance >= 1) &&
    (r.lastAward !== 2 || r.bonusClaimed) &&
    (!(r.lastAward || r.completionDelta) || (r.baseClaimed && isVictory(session.board)))
}
