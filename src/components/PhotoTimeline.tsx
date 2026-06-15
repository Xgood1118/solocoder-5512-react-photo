import { useMemo } from 'react'
import { usePhotoStore, useUIStore, useShallow } from '@/store'
import type { Photo } from '@/types'
import { PhotoCard } from './PhotoCard'
import styles from './PhotoTimeline.module.css'

interface PhotoTimelineProps {
  photos: Photo[]
}

interface Group {
  key: string
  label: string
  photos: Photo[]
}

export function PhotoTimeline({ photos }: PhotoTimelineProps) {
  const { selectedPhotoIds, toggleSelectPhoto } = usePhotoStore(
    useShallow((s) => ({
      selectedPhotoIds: s.selectedPhotoIds,
      toggleSelectPhoto: s.toggleSelectPhoto,
    })),
  )
  const openViewer = useUIStore((s) => s.openViewer)

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Photo[]>()
    for (const p of photos) {
      const d = new Date(p.takenAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, items]) => {
        const [y, m] = key.split('-')
        return {
          key,
          label: `${y} 年 ${Number(m)} 月`,
          photos: items,
        }
      })
  }, [photos])

  return (
    <div className={styles.timeline}>
      {groups.map((g) => (
        <div key={g.key} className={styles.group}>
          <div className={styles.groupHeader}>
            <div className={styles.groupDot} />
            <h2 className={styles.groupTitle}>{g.label}</h2>
            <span className={styles.groupCount}>{g.photos.length} 张</span>
          </div>
          <div className={styles.grid}>
            {g.photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                selected={selectedPhotoIds.has(photo.id)}
                onClick={() => openViewer(photo.id, photos)}
                onSelectToggle={() => toggleSelectPhoto(photo.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
