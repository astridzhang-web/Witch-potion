import { useCallback, useEffect, useRef, useState } from 'react'
import Bottle, { COLORS } from './components/Bottle'
import Icon from './components/Icon'
import PourAnimation, { measureBottle, type Flight } from './components/PourAnimation'
import type { Session } from './game/session'
import Modal from './components/Modal'
import CenterPanel from './components/CenterPanel'
import Settlement from './components/Settlement'
import { createGame, withSession, settlementPending, dismissSettlement, startNewPuzzle } from './game/progress'
import { bottlePosition, panelPosition } from './scene/cabinetLayout'
import { hasLegalMove, isVictory } from './game/rules'
import { createPuzzle, nextPuzzle } from './game/puzzles'
import { createSession, pourSession, restart, undo } from './game/session'
import { loadSave, saveProgress, type Save } from './game/storage'

function initialSave(): Save {
  try {
    const saved = loadSave(window.localStorage)
    if (saved) return saved
  } catch { /* Storage can be denied by the browser; the game still works in memory. */ }
  return createGame(createSession(createPuzzle()))
}

export default function App() {
  const [game, setGame] = useState(initialSave)
  const [selected, setSelected] = useState<number | null>(null)
  const [notice, setNotice] = useState('轻点一瓶药剂，开始今夜的调配')
  const [saved, setSaved] = useState(true)
  const [modal, setModal] = useState<'help' | 'restart' | null>(null)
  const [flight, setFlight] = useState<Flight | null>(null)
  const busyRef = useRef(false)
  const busy = flight !== null
  const commitPour = useCallback((session: Session) => {
    setGame((previous) => withSession(previous, session))
  }, [])
  const finishPour = useCallback(() => {
    busyRef.current = false
    setFlight(null)
  }, [])
  const { session, showSymbols } = game
  const won = isVictory(session.board)
  const stuck = !won && !hasLegalMove(session.board)
  const showSettlement = !busy && settlementPending(game)
  const blocked = busy || showSettlement
  const dismiss = useCallback(() => setGame(dismissSettlement), [])

  useEffect(() => {
    try { setSaved(saveProgress(window.localStorage, game)) }
    catch { setSaved(false) }
  }, [game])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function selectBottle(index: number) {
    if (won || modal || busyRef.current) return
    if (selected === index) {
      setSelected(null)
      setNotice('已放下药瓶，慢慢来就好')
    } else if (selected === null) {
      if (!session.board[index].length) {
        setNotice('这是一只空瓶，请先选择有药剂的瓶子')
        return
      }
      setSelected(index)
      setNotice(`已选药瓶 ${index + 1} · 再点空瓶或顶层同色的瓶子`)
    } else {
      const result = pourSession(session, selected, index)
      if (!result) {
        setNotice('暂时不能倒入：需要空位，且顶层颜色相同或为空瓶')
        return
      }
      const source = measureBottle(selected)
      const target = measureBottle(index)
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && source && target) {
        // A synchronous lock also catches repeated clicks before React renders disabled controls.
        busyRef.current = true
        setFlight({ ...result, source, target })
      } else commitPour(result.session)
      setSelected(null)
      setNotice(`调配 ${result.pour.amount} 格${COLORS[result.pour.color].name}药剂`)
    }
  }

  function performRestart() {
    if (busyRef.current || showSettlement) return
    setGame(previous => withSession(previous, restart(previous.session)))
    setSelected(null)
    setModal(null)
    setNotice('回到最初的配方，再试一种思路吧')
  }

  function requestRestart() {
    if (busyRef.current || showSettlement) return
    if (session.history.length && !won) setModal('restart')
    else performRestart()
  }

  function beginNew() {
    if (busyRef.current || showSettlement) return
    setGame(previous => {
      if (!isVictory(previous.session.board) || !previous.completion.settlementDismissed) return previous
      return startNewPuzzle(previous, nextPuzzle(previous.session.puzzle.presetId))
    })
    setSelected(null)
    setNotice('新的月夜配方，等待你的灵感')
  }

  return <main className="app-shell">
    <h1 className="sr-only">月夜魔法药剂室</h1>
    <section className="cabinet-scene" aria-label="月夜魔药展柜">
      <img className="cabinet-art" src="/assets/shelf-tall.webp" width="841" height="1870" alt="" fetchPriority="high" draggable={false} />
      <header className="scene-hud">
        <div className="completion-stat"><span aria-hidden="true">☾</span><span>已完成 <strong data-testid="total-completed">{game.completion.totalCompleted}</strong></span></div>
        <div className="move-stat"><span>步数</span><strong data-testid="moves">{session.history.length}</strong></div>
        <button className="icon-button" aria-label="玩法说明" disabled={blocked} onClick={() => setModal('help')}><Icon name="help" /></button>
      </header>
      <div className="board" role="group" aria-label="九只药瓶，三行三列" aria-busy={busy}>
        {session.board.map((liquid, index) => <Bottle key={index} liquid={liquid} index={index} style={bottlePosition(index)} selected={selected === index} showSymbols={showSymbols} won={won} busy={busy} animating={flight?.pour.from === index || flight?.pour.to === index} receiving={flight?.pour.to === index} onClick={() => selectBottle(index)} />)}
      </div>
      <div className="board-message" role="status" aria-live="polite" aria-atomic="true">
        <span className="message-star" aria-hidden="true">✧</span><span>{busy ? '魔法调配中…' : won ? (game.completion.settlementDismissed ? '慢慢欣赏，准备好后再开启新谜题' : '七色各归其位') : stuck ? '暂时没有可行的倒法，试试撤销或重新开始' : notice}</span>
      </div>

      <div className="controls" aria-label="木柜底座操作">
        <button className="panel-button undo-panel" style={panelPosition('undo')} disabled={blocked || !session.history.length} onClick={() => { if (busyRef.current || showSettlement) return; setGame(previous => withSession(previous, undo(previous.session))); setSelected(null); setNotice('已撤销上一步，灵感可以重来') }}><Icon name="undo" /><span>撤销</span></button>
        <button className="panel-button restart-panel" style={panelPosition('restart')} disabled={blocked} onClick={requestRestart}><Icon name="restart" /><span>重来</span></button>
        <CenterPanel revealed={won && !busy && game.completion.settlementDismissed} blocked={blocked} onNew={beginNew} />
      </div>
      {!saved && <p className="save-error" role="alert">无法自动保存，请保持此页面打开</p>}
    </section>

    {flight && <PourAnimation flight={flight} showSymbols={showSymbols} onCommit={commitPour} onFinish={finishPour} />}

    {showSettlement && <Settlement moves={session.history.length} onClose={dismiss} />}

    {modal && <Modal title={modal === 'help' ? '一瓶一色，便是魔法' : '重新调配这份药剂？'} onClose={() => setModal(null)}>
      {modal === 'help' ? <>
        <ol className="instructions"><li>轻点一只药瓶，再点另一只，即可倒入药剂。再次轻点选中的瓶子可放下。</li><li>只能倒入空瓶，或顶层颜色相同且尚有空位的瓶子。顶层连续同色的药剂会尽可能一起倒出。</li><li>让七种颜色各装满一瓶，留下两只空瓶，就完成了。遇到难题，随时撤销或重来。</li></ol>
        <p className="help-note">每份初始配方都有解；途中仍需留意顺序。开启「颜色符号」可辅助分辨颜色。进度保存在当前浏览器，清除网站数据会丢失存档。</p>
        <label className="symbols-toggle"><input type="checkbox" checked={showSymbols} onChange={event => setGame(previous => ({ ...previous, showSymbols: event.target.checked }))} /><span>颜色符号</span></label>
        <button className="dialog-primary" onClick={() => setModal(null)}>开始调配</button>
      </> : <>
        <p className="dialog-copy">当前配方保持不变，步数和撤销记录将归零。</p>
        <div className="dialog-actions"><button className="dialog-secondary" onClick={() => setModal(null)}>继续当前游戏</button><button className="dialog-primary" onClick={performRestart}>确认重来</button></div>
      </>}
    </Modal>}
  </main>
}
