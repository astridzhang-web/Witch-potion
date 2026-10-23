import { describe, it, expect } from 'vitest'
import { PRESETS, createPuzzle } from './puzzles'
import { createSession, pourSession, undo, restart } from './session'
import { createGame, withSession, dismissSettlement, startNewPuzzle, referenceMoves, settlementPending } from './progress'
import { decodeSave, saveProgress, SAVE_KEY } from './storage'

const puzzle = { presetId: PRESETS[0].id, initial: PRESETS[0].board }
function solve(extra = false, session = createSession(puzzle)) {
  const moves = extra ? [[0, 8], [8, 7], ...PRESETS[0].solution.slice(1)] : PRESETS[0].solution
  for (const [a, b] of moves) session = pourSession(session, a, b)!.session
  return session
}
const roundTrip = (game: ReturnType<typeof createGame>) => decodeSave(JSON.stringify({ ...game, version: 3 }))!

describe('crystal ledger', () => {
  it('uses each preset witness, including color relabelings, as its benchmark', () => {
    for (let i = 0; i < PRESETS.length; i++) {
      const puzzle = createPuzzle(i, () => .4)
      let session = createSession(puzzle)
      for (const [a, b] of PRESETS[i].solution) session = pourSession(session, a, b)!.session
      expect(referenceMoves(puzzle)).toBe(PRESETS[i].solution.length)
      expect(createGame(session).rewards.balance).toBe(2)
    }
  })
  it('awards two exactly at the benchmark, one at benchmark +1', () => {
    const fast = solve(), slow = solve(true)
    expect(slow.history.length).toBe(fast.history.length + 1)
    expect(createGame(fast).rewards.lastAward).toBe(2)
    expect(createGame(slow).rewards.lastAward).toBe(1)
  })
  it('also awards two below the benchmark', () => {
    // Omitting witness transfer 12 still produces a legal full solution (replayed below).
    let session = createSession(puzzle)
    for (const [a, b] of PRESETS[0].solution.filter((_, i) => i !== 12)) session = pourSession(session, a, b)!.session
    expect(session.history.length).toBe(referenceMoves(puzzle) - 1)
    expect(createGame(session).rewards.balance).toBe(2)
  })
  it('pays only the missing bonus on a later successful replay, with a truthful receipt', () => {
    let game = dismissSettlement(createGame(solve(true)))
    expect(game.rewards).toEqual({ balance: 1, baseClaimed: true, bonusClaimed: false, lastAward: 1, completionDelta: 1 })
    game = roundTrip(withSession(game, restart(game.session)))
    game = withSession(game, solve())
    expect(game.rewards).toEqual({ balance: 2, baseClaimed: true, bonusClaimed: true, lastAward: 1, completionDelta: 0 })
    expect(game.completion.totalCompleted).toBe(1)
    expect(settlementPending(game)).toBe(true)
    expect(roundTrip(game)).toEqual(game)
    expect(withSession(game, game.session)).toEqual(game)
    game = dismissSettlement(dismissSettlement(game))
    const again = withSession(withSession(game, undo(game.session)), solve())
    expect(again.rewards.balance).toBe(2)
    expect(again.rewards.lastAward).toBe(0)
    expect(settlementPending(again)).toBe(false)
  })
  it('does not grant a second base on another slow completion, undo, or restart', () => {
    const initial = dismissSettlement(createGame(solve(true)))
    for (const session of [undo(initial.session), restart(initial.session)]) {
      const again = withSession(roundTrip(withSession(initial, session)), solve(true))
      expect(again.rewards.balance).toBe(1)
      expect(again.rewards.lastAward).toBe(0)
      expect(again.completion.totalCompleted).toBe(1)
      expect(settlementPending(again)).toBe(false)
    }
  })
  it('starts a fresh ledger only for an explicitly started puzzle, even with the same preset', () => {
    const won = createGame(solve())
    expect(startNewPuzzle(won, puzzle)).toBe(won)
    const next = startNewPuzzle(dismissSettlement(won), puzzle)
    expect(next.rewards).toEqual({ balance: 2, baseClaimed: false, bonusClaimed: false, lastAward: 0, completionDelta: 0 })
    expect(startNewPuzzle(next, puzzle)).toBe(next)
    const twice = withSession(next, solve())
    expect(twice.rewards.balance).toBe(4)
    expect(twice.completion.totalCompleted).toBe(2)
  })
  it('persists the complete winning receipt in one write; failed writes retain the prior record', () => {
    let raw = JSON.stringify({ ...createGame(undo(solve())), version: 3 })
    const before = raw
    const won = createGame(solve())
    expect(saveProgress({ getItem: () => raw, setItem: () => { throw new Error('quota') } }, won)).toBe(false)
    expect(raw).toBe(before)
    const writes: string[] = []
    expect(saveProgress({ getItem: () => raw, setItem: (key, value) => { expect(key).toBe(SAVE_KEY); raw = value; writes.push(value) } }, won)).toBe(true)
    expect(writes).toHaveLength(1)
    expect(decodeSave(raw)).toEqual(won)
    expect(withSession(decodeSave(raw)!, won.session)).toEqual(won)
  })
})

describe('legacy reward migration', () => {
  for (const version of [1, 2]) {
    it(`preserves an unfinished v${version} session and grants future rewards normally`, () => {
      const session = undo(solve())
      const completion = { totalCompleted: 7, currentPuzzleCounted: false, settlementDismissed: false }
      const game = decodeSave(JSON.stringify({ version, session, completion, showSymbols: true }))!
      expect(game.session).toEqual(session)
      expect(game).not.toHaveProperty('showSymbols')
      expect(game.rewards.balance).toBe(0)
      expect(game.rewards.baseClaimed).toBe(false)
      const won = withSession(roundTrip(game), solve())
      expect(won.rewards.balance).toBe(2)
      expect(won.completion.totalCompleted).toBe(version === 1 ? 1 : 8)
    })
    it(`retires historical base in v${version}, grants nothing on repeated reload, allows a future bonus`, () => {
      const session = solve()
      const completion = { totalCompleted: 7, currentPuzzleCounted: true, settlementDismissed: true }
      let game = decodeSave(JSON.stringify({ version, session, completion, showSymbols: true }))!
      for (let i = 0; i < 5; i++) game = roundTrip(game)
      expect(game.rewards).toEqual({ balance: 0, baseClaimed: true, bonusClaimed: false, lastAward: 0, completionDelta: 0 })
      expect(game.completion.settlementDismissed).toBe(version === 2)
      expect(game.completion.totalCompleted).toBe(version === 2 ? 7 : 1)
      game = withSession(dismissSettlement(game), undo(session))
      const bonus = withSession(roundTrip(game), session)
      expect(bonus.rewards.balance).toBe(1)
      expect(bonus.rewards.completionDelta).toBe(0)
      expect(settlementPending(bonus)).toBe(true)
    })
  }
  it('retains v2 credited-but-restarted status, so the base cannot be reclaimed', () => {
    const completion = { totalCompleted: 3, currentPuzzleCounted: true, settlementDismissed: true }
    const game = decodeSave(JSON.stringify({ version: 2, session: createSession(puzzle), showSymbols: false, completion }))!
    expect(game.rewards.baseClaimed).toBe(true)
    const won = withSession(roundTrip(game), solve())
    expect(won.rewards.balance).toBe(1)
    expect(won.completion.totalCompleted).toBe(3)
  })
  it.each([
    { balance: -1 }, { balance: 1.5 }, { baseClaimed: false }, { lastAward: 3 },
    { bonusClaimed: 'yes' }, { lastAward: 2, bonusClaimed: false }, { completionDelta: 2 },
  ])('rejects corrupt v3 reward metadata %j', patch => {
    const game = createGame(solve())
    expect(decodeSave(JSON.stringify({ ...game, version: 3, rewards: { ...game.rewards, ...patch } }))).toBeNull()
  })
})

// Removing an optional UI preference must never discard otherwise valid saves.
for (const version of [1, 2, 3]) {
  it(`ignores retired symbol metadata in v${version} across active, won, dismissed and undone games`, () => {
    const won = createGame(solve())
    const dismissed = dismissSettlement(won)
    const cases = [createGame(undo(solve())), won, dismissed, withSession(dismissed, undo(won.session)), withSession(dismissed, restart(won.session))]
    for (const game of cases) {
      const expected = decodeSave(JSON.stringify({ ...game, version }))!
      expect(expected).not.toBeNull()
      expect(expected.session).toEqual(game.session)
      if (version === 3) expect(expected).toEqual(game)
      for (const showSymbols of [true, false, undefined, 'obsolete']) {
        const restored = decodeSave(JSON.stringify({ ...game, version, showSymbols }))!
        expect(restored).toEqual(expected)
        expect(restored).not.toHaveProperty('showSymbols')
        const writes: string[] = []
        expect(saveProgress({ getItem: () => null, setItem: (_, raw) => { writes.push(raw) } }, restored)).toBe(true)
        expect(JSON.parse(writes[0])).not.toHaveProperty('showSymbols')
        expect(decodeSave(writes[0])).toEqual(restored)
      }
    }
  })
}
