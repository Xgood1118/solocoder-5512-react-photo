import { usePhotoStore, useUIStore } from '@/store'
import type { Photo } from '@/types'
import { PhotoCard } from './PhotoCard'
import styles from './PhotoGrid.module.css'

interface PhotoGridProps {
  photos: Photo[]
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const { selectedPhotoIds, toggleSelectPhoto } = usePhotoStore()
  const openViewer = useUIStore((s) => s.openViewer)

  return (
    <div className={styles.grid}>
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          selected={selectedPhotoIds.has(photo.id)}
          onClick={() => openViewer(photo.id, photos)}
          onSelectToggle={() => toggleSelectPhoto(photo.id)}
        />
      ))}
    </div>
  )
}
