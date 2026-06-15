import { usePhotoStore, useUIStore, useShallow } from '@/store'
import type { Photo } from '@/types'
import { PhotoCard } from './PhotoCard'
import styles from './PhotoMasonry.module.css'

interface PhotoMasonryProps {
  photos: Photo[]
}

export function PhotoMasonry({ photos }: PhotoMasonryProps) {
  const { selectedPhotoIds, toggleSelectPhoto } = usePhotoStore(
    useShallow((s) => ({
      selectedPhotoIds: s.selectedPhotoIds,
      toggleSelectPhoto: s.toggleSelectPhoto,
    })),
  )
  const openViewer = useUIStore((s) => s.openViewer)

  return (
    <div className={styles.masonry}>
      {photos.map((photo) => (
        <div key={photo.id} className={styles.item}>
          <PhotoCard
            photo={photo}
            selected={selectedPhotoIds.has(photo.id)}
            onClick={() => openViewer(photo.id, photos)}
            onSelectToggle={() => toggleSelectPhoto(photo.id)}
            masonry
          />
        </div>
      ))}
    </div>
  )
}
