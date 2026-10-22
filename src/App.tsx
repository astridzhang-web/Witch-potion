import { useCallback, useEffect, useRef, useState } from 'react'
import Bottle, { COLORS } from './components/Bottle'
import Icon from './components/Icon'
import PourAnimation, { measureBottle, type Flight } from './components/PourAnimation'
import type { Session } from './game/session'
import Modal from './components/Modal'
import { bottlePosition, panelPosition } from './scene/cabinetLayout'
import { hasLegalMove, isComplete, isVictory } from './game/rules'
import { createPuzzle, nextPuzzle, PRESETS } from './game/puzzles'
import { createSession, pourSession, restart, undo } from './game/session'
import { loadSave, saveProgress, type Save } from './game/storage'

function initialSave(): Save {
  try {
    const saved = loadSave(window.localStorage)
    if (saved) return saved
  } catch { /* Storage can be denied by the browser; the game still works in memory. */ }
  return { session: createSession(createPuzzle()), showSymbols: false }
}

export default function App() {
  const [game, setGame] = useState(initialSave)
  const [selected, setSelected] = useState<number | null>(null)
  const [notice, setNotice] = useState('轻点一瓶药剂，开始今夜的调配')
  const [saved, setSaved] = useState(true)
  const [modal, setModal] = useState<'help' | 'restart' | 'new' | null>(null)
  const [flight, setFlight] = useState<Flight | null>(null)
  const busyRef = useRef(false)
  const busy = flight !== null
  const commitPour = useCallback((session: Session) => {
    setGame((previous) => ({ ...previous, session }))
  }, [])
  const finishPour = useCallback(() => {
    busyRef.current = false
    setFlight(null)
  }, [])
  const { session, showSymbols } = game
  const won = isVictory(session.board)
  const completed = session.board.filter(isComplete).length
  const stuck = !won && !hasLegalMove(session.board)
  const puzzleNumber = PRESETS.findIndex((preset) => preset.id === session.puzzle.presetId) + 1

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

  function perform(action: 'restart' | 'new') {
    if (busyRef.current) return
    setGame({ ...game, session: action === 'restart' ? restart(session) : createSession(nextPuzzle(session.puzzle.presetId)) })
    setSelected(null)
    setModal(null)
    setNotice(action === 'restart' ? '回到最初的配方，再试一种思路吧' : '新的月夜配方，等待你的灵感')
  }

  function request(action: 'restart' | 'new') {
    if (busyRef.current) return
    if (session.history.length && !won) setModal(action)
    else perform(action)
  }

  return <main className="app-shell">
    <h1 className="sr-only">月夜魔法药剂室</h1>
    <section className="cabinet-scene" aria-label="月夜魔药展柜">
      <img className="cabinet-art" src="/assets/shelf-tall.webp" width="841" height="1870" alt="" fetchPriority="high" draggable={false} />
      <header className="scene-hud">
        <div className="puzzle-id"><span aria-hidden="true">☾</span><span>手记 <strong>{String(puzzleNumber).padStart(2, '0')}</strong></span></div>
        <div className="move-stat"><span>步数</span><strong data-testid="moves">{session.history.length}</strong></div>
        <span className="sr-only" data-testid="completed">{completed} / 7</span>
        <button className="new-puzzle" disabled={busy} onClick={() => request('new')}><Icon name="new" /><span>{won ? '下一份配方' : '新谜题'}</span></button>
        <button className="icon-button" aria-label="玩法说明" disabled={busy} onClick={() => setModal('help')}><Icon name="help" /></button>
      </header>
      <div className="board" role="group" aria-label="九只药瓶，三行三列" aria-busy={busy}>
        {session.board.map((liquid, index) => <Bottle key={index} liquid={liquid} index={index} style={bottlePosition(index)} selected={selected === index} showSymbols={showSymbols} won={won} busy={busy} animating={flight?.pour.from === index || flight?.pour.to === index} receiving={flight?.pour.to === index} onClick={() => selectBottle(index)} />)}
      </div>
      <div className={`board-message ${won ? 'victory' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {won && !busy ? <><Icon name="sparkle" /><div><strong>月夜调配完成</strong><span>七色各归其位 · 共用了 {session.history.length} 步</span></div><Icon name="sparkle" /></> : <><span className="message-star" aria-hidden="true">✧</span><span>{busy ? '魔法调配中…' : stuck ? '暂时没有可行的倒法，试试撤销或重新开始' : notice}</span></>}
      </div>

      <div className="controls" aria-label="木柜底座操作">
        <button className="panel-button undo-panel" style={panelPosition('undo')} disabled={busy || !session.history.length} onClick={() => { if (busyRef.current) return; setGame({ ...game, session: undo(session) }); setSelected(null); setNotice('已撤销上一步，灵感可以重来') }}><Icon name="undo" /><span>撤销</span></button>
        <button className="panel-button restart-panel" style={panelPosition('restart')} disabled={busy} onClick={() => request('restart')}><Icon name="restart" /><span>重来</span></button>
      </div>
      <footer className="footer">
        <label className="symbols-toggle"><input type="checkbox" disabled={busy} checked={showSymbols} onChange={(event) => setGame({ ...game, showSymbols: event.target.checked })} /><span>颜色符号</span></label>
        <span className={`save-status ${saved ? '' : 'save-error'}`} role="status">{saved ? <><Icon name="check" />进度已存于此设备</> : '无法自动保存，请保持此页面打开'}</span>
      </footer>
    </section>

    {flight && <PourAnimation flight={flight} showSymbols={showSymbols} onCommit={commitPour} onFinish={finishPour} />}

    {modal && <Modal title={modal === 'help' ? '一瓶一色，便是魔法' : modal === 'restart' ? '重新调配这份药剂？' : '翻开新的月光手记？'} onClose={() => setModal(null)}>
      {modal === 'help' ? <>
        <ol className="instructions"><li>轻点一只药瓶，再点另一只，即可倒入药剂。再次轻点选中的瓶子可放下。</li><li>只能倒入空瓶，或顶层颜色相同且尚有空位的瓶子。顶层连续同色的药剂会尽可能一起倒出。</li><li>让七种颜色各装满一瓶，留下两只空瓶，就完成了。遇到难题，随时撤销或重来。</li></ol>
        <p className="help-note">每份初始配方都有解；途中仍需留意顺序。开启「颜色符号」可辅助分辨颜色。进度保存在当前浏览器，清除网站数据会丢失存档。</p>
        <button className="dialog-primary" onClick={() => setModal(null)}>开始调配</button>
      </> : <>
        <p className="dialog-copy">{modal === 'restart' ? '当前配方保持不变，步数和撤销记录将归零。' : '当前进度将被替换。新配方也经过可解性验证，放心探索。'}</p>
        <div className="dialog-actions"><button className="dialog-secondary" onClick={() => setModal(null)}>继续当前游戏</button><button className="dialog-primary" onClick={() => perform(modal)}>{modal === 'restart' ? '确认重来' : '开始新谜题'}</button></div>
      </>}
    </Modal>}
  </main>
}
