import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { db } from '@/composables/useDB'
import { usePhotoStore, useUIStore, useShallow } from '@/store'
import { PhotoGrid } from '@/components/PhotoGrid'
import { PhotoMasonry } from '@/components/PhotoMasonry'
import { PhotoTimeline } from '@/components/PhotoTimeline'
import { PhotoViewer } from '@/components/PhotoViewer'
import { ProgressBar } from '@/components/ProgressBar'
import type { Photo, Album } from '@/types'
import styles from './PageStyles.module.css'

export function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { viewMode, setPhotos } = usePhotoStore(
    useShallow((s) => ({ viewMode: s.viewMode, setPhotos: s.setPhotos })),
  )
  const batchProgress = useUIStore((s) => s.batchProgress)

  const [photos, setLocalPhotos] = useState<Photo[]>([])
  const [album, setAlbum] = useState<Album | null>(null)

  useEffect(() => {
    if (!id) return
    db.getAllAlbums().then((list) => {
      const found = list.find((a) => a.id === id) ?? null
      setAlbum(found)
    })
    db.getPhotosByAlbum(id).then((list) => {
      setLocalPhotos(list)
      setPhotos(list)
    })
  }, [id])

  const renderView = () => {
    switch (viewMode) {
      case 'masonry':
        return <PhotoMasonry photos={photos} />
      case 'timeline':
        return <PhotoTimeline photos={photos} />
      case 'grid':
      default:
        return <PhotoGrid photos={photos} />
    }
  }

  return (
    <div className={styles.page}>
      {batchProgress && (
        <ProgressBar progress={batchProgress.done} total={batchProgress.total} topBar />
      )}
      <div
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-primary)',
        }}
      >
        <button
          onClick={() => navigate('/albums')}
          style={{
            padding: 6,
            borderRadius: 6,
            color: 'var(--text-secondary)',
            display: 'flex',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        <div>
          <h1 style={{ fontSize: 20 }}>{album?.name ?? '加载中...'}</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{photos.length} 张照片</div>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.content}>
          {photos.length === 0 ? (
            <div className={styles.empty}>
              <h2 className={styles.emptyTitle}>相册是空的</h2>
              <p className={styles.emptyText}>在照片库中选择照片，批量移动到这个相册。</p>
              <button className={styles.importBtn} onClick={() => navigate('/')}>
                去照片库
              </button>
            </div>
          ) : (
            renderView()
          )}
        </div>
      </div>
      <PhotoViewer />
    </div>
  )
}
