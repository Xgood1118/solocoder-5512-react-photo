import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import styles from './Modal.module.css'

export interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children?: ReactNode
  actions?: ModalAction[]
  width?: number
}

export function Modal({ open, title, onClose, children, actions, width }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={width ? { maxWidth: width } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {actions && actions.length > 0 && (
          <div className={styles.footer}>
            {actions.map((a, i) => (
              <button
                key={i}
                className={`${styles.btn} ${
                  a.variant === 'danger'
                    ? styles.btnDanger
                    : a.variant === 'primary'
                    ? styles.btnPrimary
                    : styles.btnSecondary
                }`}
                onClick={a.onClick}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
