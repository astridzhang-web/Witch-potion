import { describe, expect, it } from 'vitest'
import { PRESETS } from './puzzles'
import { createSession, pourSession, restart, undo, type Session } from './session'
import { createGame, withSession, dismissSettlement, settlementPending, startNewPuzzle } from './progress'
import { decodeSave, loadSave, saveProgress, SAVE_KEY } from './storage'

const puzzle = { presetId: PRESETS[0].id, initial: PRESETS[0].board }
function play(session = createSession(puzzle), count = PRESETS[0].solution.length) {
  for (const [a, b] of PRESETS[0].solution.slice(0, count)) session = pourSession(session, a, b)!.session
  return session
}
function memory() {
  const entries = new Map<string, string>()
  return { entries, getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value) } }
}
const legacy = (session: Session) => JSON.stringify({ version: 1, session, showSymbols: true })

describe('completion transactions', () => {
  it('credits the first winning transaction once even if commit is repeated', () => {
    const initial = createGame(createSession(puzzle))
    const won = play()
    const game = withSession(initial, won)
    expect(game.completion).toEqual({ totalCompleted: 1, currentPuzzleCounted: true, settlementDismissed: false })
    expect(settlementPending(game)).toBe(true)
    expect(withSession(withSession(game, won), won)).toEqual(game)
    expect(initial.completion.totalCompleted).toBe(0)
  })
  it('retains credit and dismissal through undo, restart and repeat completion', () => {
    const won = play()
    const game = dismissSettlement(createGame(won))
    for (const session of [undo(won), restart(won)]) {
      const backed = withSession(game, session)
      expect(backed.completion).toEqual(game.completion)
      expect(settlementPending(backed)).toBe(false)
      const again = withSession(backed, won)
      expect(again.completion.totalCompleted).toBe(1)
      expect(settlementPending(again)).toBe(false)
    }
  })
  it('starts only after settlement dismissal and counts a new instance even of the same preset', () => {
    const first = createGame(play())
    expect(startNewPuzzle(first, puzzle)).toBe(first)
    const next = startNewPuzzle(dismissSettlement(first), puzzle)
    expect(next.session.history).toHaveLength(0)
    expect(next.completion).toEqual({ totalCompleted: 1, currentPuzzleCounted: false, settlementDismissed: false })
    expect(startNewPuzzle(next, puzzle)).toBe(next)
    expect(withSession(next, play()).completion.totalCompleted).toBe(2)
  })
  it('cannot dismiss settlement or increment the counter on unfinished play', () => {
    const game = createGame(play(createSession(puzzle), 5))
    expect(game.completion.totalCompleted).toBe(0)
    expect(dismissSettlement(game)).toBe(game)
    expect(settlementPending(game)).toBe(false)
  })
})

describe('v1 migration and atomic current-version persistence', () => {
  it('preserves every board, move, undo step and symbol setting in an unfinished v1 save', () => {
    const session = play(createSession(puzzle), 7)
    const migrated = decodeSave(legacy(session))!
    expect(migrated.session).toEqual(session)
    expect(migrated.showSymbols).toBe(true)
    expect(migrated.completion.totalCompleted).toBe(0)
    const storage = memory()
    expect(saveProgress(storage, migrated)).toBe(true)
    expect(loadSave(storage)).toEqual(migrated)
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).version).toBe(3)
    expect(storage.entries.size).toBe(1)
  })
  it('credits a solved v1 board once, restores pending settlement, then preserves dismissal', () => {
    const session = play()
    let game = decodeSave(legacy(session))!
    const storage = memory()
    expect(game.session).toEqual(session)
    for (let refresh = 0; refresh < 4; refresh++) {
      expect(saveProgress(storage, game)).toBe(true)
      game = loadSave(storage)!
      expect(game.completion.totalCompleted).toBe(1)
      expect(settlementPending(game)).toBe(true)
    }
    game = dismissSettlement(game)
    saveProgress(storage, game)
    expect(loadSave(storage)).toEqual(game)
    expect(settlementPending(loadSave(storage)!)).toBe(false)
    const again = withSession(withSession(game, restart(game.session)), session)
    expect(again.completion.totalCompleted).toBe(1)
  })
  it('restores credited-but-undone/restarted v2 games without recounting on a later win', () => {
    const storage = memory()
    const first = dismissSettlement(createGame(play()))
    for (const session of [undo(first.session), restart(first.session)]) {
      const beforeReload = withSession(first, session)
      saveProgress(storage, beforeReload)
      const restored = loadSave(storage)!
      expect(restored).toEqual(beforeReload)
      expect(withSession(restored, play()).completion.totalCompleted).toBe(1)
    }
  })
  it('writes board, lifetime count, credit and dismissal as one record', () => {
    const writes: string[] = []
    const game = dismissSettlement(createGame(play()))
    const storage = { getItem: () => null, setItem: (key: string, raw: string) => { expect(key).toBe(SAVE_KEY); writes.push(raw) } }
    expect(saveProgress(storage, game)).toBe(true)
    expect(writes).toHaveLength(1)
    expect(decodeSave(writes[0])).toEqual(game)
  })
  it('failed writes do not mutate the game or partially replace an existing record', () => {
    const old = legacy(createSession(puzzle))
    const game = createGame(play())
    const storage = { getItem: () => old, setItem: () => { throw new Error('quota') } }
    expect(saveProgress(storage, game)).toBe(false)
    expect(storage.getItem()).toBe(old)
    expect(game.completion.totalCompleted).toBe(1)
  })
  it.each([
    { totalCompleted: -1, currentPuzzleCounted: false, settlementDismissed: false },
    { totalCompleted: 1.5, currentPuzzleCounted: true, settlementDismissed: false },
    { totalCompleted: 0, currentPuzzleCounted: true, settlementDismissed: false },
    { totalCompleted: 1, currentPuzzleCounted: false, settlementDismissed: true },
    { totalCompleted: 1, currentPuzzleCounted: 'yes', settlementDismissed: false },
  ])('rejects inconsistent v2 completion data: %j', completion => {
    expect(decodeSave(JSON.stringify({ version: 2, ...createGame(createSession(puzzle)), completion }))).toBeNull()
  })
  it('rejects a v2 winning board without its committed credit marker', () => {
    const game = createGame(play())
    expect(decodeSave(JSON.stringify({ version: 2, ...game, completion: { totalCompleted: 0, currentPuzzleCounted: false, settlementDismissed: false } }))).toBeNull()
  })
})
