import { Check } from 'lucide-react'
import type { Photo } from '@/types'
import styles from './PhotoCard.module.css'

interface PhotoCardProps {
  photo: Photo
  onClick?: () => void
  selected?: boolean
  onSelectToggle?: () => void
  masonry?: boolean
}

export function PhotoCard({ photo, onClick, selected, onSelectToggle, masonry }: PhotoCardProps) {
  const takenAt = new Date(photo.takenAt)
  const timeStr = takenAt.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <div
      className={`${styles.card} ${masonry ? styles.masonryCard : ''} ${selected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <img src={photo.thumbnail} alt={photo.fileName} className={styles.img} loading="lazy" />
      <div className={styles.overlay} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topRow}>
          <div className={styles.checkbox} onClick={onSelectToggle}>
            {selected && <Check size={14} className={styles.checkIcon} strokeWidth={3} />}
          </div>
        </div>
        <div className={styles.bottomRow}>
          <div className={styles.fileName}>{photo.fileName}</div>
          <div className={styles.time}>{timeStr}</div>
        </div>
      </div>
    </div>
  )
}
