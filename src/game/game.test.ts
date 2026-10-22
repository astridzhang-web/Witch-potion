import { describe, expect, it } from 'vitest'
import { boardsEqual, hasLegalMove, isBoard, isVictory, planPour, type Board, type Color } from './rules'
import { createPuzzle, isVerifiedPuzzle, nextPuzzle, PRESETS } from './puzzles'
import { createSession, pourSession, restart, undo } from './session'
import { decodeSave, loadSave, saveProgress, SAVE_KEY } from './storage'

const solved: Board = [...Array.from({ length: 7 }, (_, c) => Array<Color>(4).fill(c as Color)), [], []]
const puzzle = { presetId: PRESETS[0].id, initial: PRESETS[0].board }
const start = () => createSession(puzzle)

function replay(board: Board, solution: readonly (readonly [number, number])[]) {
  for (const [from, to] of solution) {
    const move = planPour(board, from, to)
    expect(move, `illegal witness step ${from} → ${to}`).not.toBeNull()
    board = move!.after
    expect(isBoard(board)).toBe(true)
  }
  expect(isVictory(board)).toBe(true)
}

describe('pour rules', () => {
  it('moves the maximal contiguous top group into an empty bottle, immutably', () => {
    const board: Board = [[0, 1, 1], [], [], [], [], [], [], [], []]
    const before = JSON.stringify(board)
    const move = planPour(board, 0, 1)!
    expect(move.amount).toBe(2)
    expect(move.color).toBe(1)
    expect(move.after[0]).toEqual([0])
    expect(move.after[1]).toEqual([1, 1])
    expect(JSON.stringify(board)).toBe(before)
    expect(move.before).toBe(board)
  })
  it('limits the group to destination capacity', () => {
    const move = planPour([[0, 1, 1, 1], [2, 2, 1]], 0, 1)!
    expect(move.amount).toBe(1)
    expect(move.after).toEqual([[0, 1, 1], [2, 2, 1, 1]])
  })
  it.each([
    { board: [[0], [1]], from: 0, to: 1, reason: 'mismatched top' },
    { board: [[0], [0, 0, 0, 0]], from: 0, to: 1, reason: 'full target' },
    { board: [[], []], from: 0, to: 1, reason: 'empty source' },
    { board: [[0], []], from: 0, to: 0, reason: 'same bottle' },
    { board: [[0], []], from: -1, to: 1, reason: 'negative index' },
    { board: [[0], []], from: 0, to: 10, reason: 'missing target' },
    { board: [[0], []], from: 0.5, to: 1, reason: 'fractional index' },
  ])('rejects $reason without mutating input', ({ board, from, to }) => {
    const before = JSON.stringify(board)
    expect(planPour(board as Board, from, to)).toBeNull()
    expect(JSON.stringify(board)).toBe(before)
  })
  it('does not include lower noncontiguous units', () => {
    expect(planPour([[1, 0, 1], []], 0, 1)?.amount).toBe(1)
  })
  it('recognizes victory only with exact counts, full uniform bottles, and two empties', () => {
    expect(isVictory(solved)).toBe(true)
    expect(isVictory(puzzle.initial)).toBe(false)
    expect(isVictory([[0], [1], [2], [3], [4], [5], [6], [], []])).toBe(false)
    expect(isVictory(solved.slice(1))).toBe(false)
    expect(isVictory([...solved.slice(0, 6), [0, 0, 0, 0], [], []])).toBe(false)
  })
  it('validates shape, capacity, color range and conservation', () => {
    expect(isBoard(solved)).toBe(true)
    for (const malformed of [null, [], [[7]], [...solved, []], [[0, 0, 0, 0, 0], ...solved.slice(1)], [[0.5, 0, 0, 0], ...solved.slice(1)]]) {
      expect(isBoard(malformed)).toBe(false)
    }
  })
  it('detects a blocked board as well as available moves', () => {
    expect(hasLegalMove([[0, 1, 2, 3], [4, 5, 6, 0]])).toBe(false)
    expect(hasLegalMove(puzzle.initial)).toBe(true)
  })
})

describe('verified puzzles', () => {
  for (const preset of PRESETS) {
    it(`${preset.id} starts with seven mixed full bottles and two empty bottles, and solves legally`, () => {
      expect(isBoard(preset.board)).toBe(true)
      expect(preset.board.filter((b) => !b.length)).toHaveLength(2)
      expect(preset.board.filter((b) => b.length === 4 && new Set(b).size > 1)).toHaveLength(7)
      replay(preset.board, preset.solution)
    })
  }
  it('preserves solvability across 200 seeded color permutations', () => {
    let seed = 9183
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32)
    for (let i = 0; i < 200; i++) {
      const generated = createPuzzle(i, random)
      expect(isVerifiedPuzzle(generated)).toBe(true)
      replay(generated.initial, PRESETS[i % PRESETS.length].solution)
    }
  })
  it('cycles templates and rejects unverified starting arrangements', () => {
    expect(nextPuzzle(PRESETS[3].id).presetId).toBe(PRESETS[0].id)
    expect(nextPuzzle(PRESETS[0].id).presetId).toBe(PRESETS[1].id)
    expect(isVerifiedPuzzle({ presetId: 'unknown', initial: puzzle.initial })).toBe(false)
    expect(isVerifiedPuzzle({ ...puzzle, initial: solved })).toBe(false)
  })
})

describe('sessions', () => {
  it('records each transfer as one move, undoes exactly, and safely handles empty history', () => {
    const original = start()
    const [a, b] = PRESETS[0].solution[0]
    const moved = pourSession(original, a, b)!
    expect(moved.session.history).toHaveLength(1)
    expect(moved.pour.amount).toBe(2)
    expect(undo(moved.session)).toEqual(original)
    expect(undo(original)).toBe(original)
    expect(original.history).toHaveLength(0)
  })
  it('invalid input leaves the complete session unchanged', () => {
    const original = start()
    expect(pourSession(original, 0, 1)).toBeNull()
    expect(original).toEqual(start())
  })
  it('restart restores the exact current puzzle and zero moves', () => {
    let session = start()
    for (const [a, b] of PRESETS[0].solution.slice(0, 5)) session = pourSession(session, a, b)!.session
    expect(restart(session)).toEqual(start())
    expect(restart(session).puzzle).toBe(puzzle)
  })
  it('allows undo after winning and rejects further pours until undo', () => {
    let session = start()
    for (const [a, b] of PRESETS[0].solution) session = pourSession(session, a, b)!.session
    expect(isVictory(session.board)).toBe(true)
    expect(pourSession(session, 0, 8)).toBeNull()
    expect(isVictory(undo(session).board)).toBe(false)
  })
})

describe('versioned local saves', () => {
  it('round-trips puzzle, board, full undo history, and display settings', () => {
    const session = pourSession(start(), ...PRESETS[0].solution[0])!.session
    const memory = new Map<string, string>()
    const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value) } }
    expect(saveProgress(storage, { session, showSymbols: true })).toBe(true)
    expect(memory.has(SAVE_KEY)).toBe(true)
    expect(loadSave(storage)).toEqual({ session, showSymbols: true })
    expect(boardsEqual(undo(loadSave(storage)!.session).board, puzzle.initial)).toBe(true)
  })
  it.each([null, '{', '{}', 'null', '{"version":2}', '[]'])('safely rejects corrupt/unknown data: %s', (raw) => {
    expect(decodeSave(raw)).toBeNull()
  })
  it('rejects impossible history, forged initial boards, and partial manual pours', () => {
    const session = pourSession(start(), ...PRESETS[0].solution[0])!.session
    const encode = (value: unknown) => JSON.stringify({ version: 1, showSymbols: true, session: value })
    expect(decodeSave(encode({ ...session, board: solved }))).toBeNull()
    expect(decodeSave(encode({ ...session, history: [] }))).toBeNull()
    expect(decodeSave(encode({ ...session, puzzle: { ...puzzle, initial: solved } }))).toBeNull()
    const partial = puzzle.initial.map((b, i) => i === 0 ? b.slice(0, -1) : i === 7 ? [4] : b)
    expect(decodeSave(encode({ ...session, board: partial }))).toBeNull()
  })
  it('handles denied storage and quota errors without crashing', () => {
    const unavailable = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('quota') } }
    expect(loadSave(unavailable)).toBeNull()
    expect(saveProgress(unavailable, { session: start(), showSymbols: false })).toBe(false)
  })
  it('can restore a completed puzzle with its undo history', () => {
    let session = start()
    for (const [a, b] of PRESETS[0].solution) session = pourSession(session, a, b)!.session
    const saved = decodeSave(JSON.stringify({ version: 1, session, showSymbols: false }))!
    expect(isVictory(saved.session.board)).toBe(true)
    expect(saved.session.history).toHaveLength(PRESETS[0].solution.length)
  })
})
