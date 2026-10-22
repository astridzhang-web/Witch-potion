import { useEffect, useState } from 'react'
import Bottle, { COLORS } from './components/Bottle'
import Icon from './components/Icon'
import Modal from './components/Modal'
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
    if (won || modal) return
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
      setGame({ ...game, session: result.session })
      setSelected(null)
      setNotice(`已倒入 ${result.pour.amount} 格${COLORS[result.pour.color].name}药剂`)
    }
  }

  function perform(action: 'restart' | 'new') {
    setGame({ ...game, session: action === 'restart' ? restart(session) : createSession(nextPuzzle(session.puzzle.presetId)) })
    setSelected(null)
    setModal(null)
    setNotice(action === 'restart' ? '回到最初的配方，再试一种思路吧' : '新的月夜配方，等待你的灵感')
  }

  function request(action: 'restart' | 'new') {
    if (session.history.length && !won) setModal(action)
    else perform(action)
  }

  return <main className="app-shell">
    <header className="header">
      <div className="header-top"><span className="eyebrow">A LITTLE EVERYDAY MAGIC</span><button className="icon-button" aria-label="玩法说明" onClick={() => setModal('help')}><Icon name="help" /></button></div>
      <div className="brand">
        <svg className="moon-mark" width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="29" stroke="currentColor" strokeOpacity=".2" />
          <path d="M39 12a21 21 0 1 0 12 34A22 22 0 0 1 39 12Z" fill="currentColor" />
          <path d="m46 17 1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5Z" fill="currentColor" />
        </svg>
        <div><h1>月夜魔法药剂室</h1><p className="brand-en">MOONLIT ALCHEMY</p></div>
      </div>
      <p className="subtitle">让纷繁的色彩，慢慢归于宁静。</p>
    </header>

    <section className="game-panel" aria-label="药剂调配台">
      <div className="game-stats">
        <div className="chapter"><span className="chapter-icon" aria-hidden="true">☾</span><div><span className="stat-caption">今夜的配方</span><strong>月光手记 <span className="chapter-number">{String(puzzleNumber).padStart(2, '0')}</span></strong></div></div>
        <div className="stat"><span className="stat-caption">已归位</span><strong data-testid="completed">{completed}<span> / 7</span></strong></div>
        <div className="stat"><span className="stat-caption">步数</span><strong data-testid="moves">{session.history.length}</strong></div>
      </div>
      <div className="board" role="group" aria-label="九只药瓶，三行三列">
        {session.board.map((liquid, index) => <Bottle key={index} liquid={liquid} index={index} selected={selected === index} showSymbols={showSymbols} won={won} onClick={() => selectBottle(index)} />)}
      </div>
      <div className={`board-message ${won ? 'victory' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {won ? <><Icon name="sparkle" /><div><strong>月夜调配完成</strong><span>七色各归其位 · 共用了 {session.history.length} 步</span></div><Icon name="sparkle" /></> : <><span className="message-star" aria-hidden="true">✧</span><span>{stuck ? '暂时没有可行的倒法，试试撤销或重新开始' : notice}</span></>}
      </div>
    </section>

    <div className="controls" aria-label="游戏操作">
      <button className="control-button" disabled={!session.history.length} onClick={() => { setGame({ ...game, session: undo(session) }); setSelected(null); setNotice('已撤销上一步，灵感可以重来') }}><Icon name="undo" /><span>撤销</span></button>
      <button className="control-button" onClick={() => request('restart')}><Icon name="restart" /><span>重来</span></button>
      <button className="control-button primary" onClick={() => request('new')}><Icon name="new" /><span>{won ? '下一份配方' : '新谜题'}</span></button>
    </div>
    <footer className="footer">
      <label className="symbols-toggle"><input type="checkbox" checked={showSymbols} onChange={(event) => setGame({ ...game, showSymbols: event.target.checked })} /><span>颜色符号</span></label>
      <span className={`save-status ${saved ? '' : 'save-error'}`} role="status">{saved ? <><Icon name="check" />进度已存于此设备</> : '无法自动保存，请保持此页面打开'}</span>
    </footer>
    <p className="closing-note"><span aria-hidden="true">✦</span> 不赶时间，魔法自会发生 <span aria-hidden="true">✦</span></p>

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
