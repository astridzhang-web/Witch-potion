import { useEffect, useRef, type ReactNode } from 'react'
import Icon from './Icon'

export default function Modal({ title, onClose, children, simple = false }: { title: string; onClose(): void; children: ReactNode; simple?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className={`modal ${simple ? 'help-modal' : ''}`} aria-labelledby="modal-title" onCancel={onClose}
    onClick={event => {
      if (!simple || event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
    }}>
    <button className="icon-button modal-close" aria-label="关闭" onClick={onClose}><Icon name="close" /></button>
    {!simple && <span className="eyebrow">MOONLIT NOTES</span>}
    <h2 id="modal-title">{title}</h2>
    {children}
  </dialog>
}
