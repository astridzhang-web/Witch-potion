import { useEffect, useRef, type ReactNode } from 'react'
import Icon from './Icon'

export default function Modal({ title, onClose, children }: { title: string; onClose(): void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={onClose}>
    <button className="icon-button modal-close" aria-label="关闭" onClick={onClose}><Icon name="close" /></button>
    <span className="eyebrow">MOONLIT NOTES</span>
    <h2 id="modal-title">{title}</h2>
    {children}
  </dialog>
}
