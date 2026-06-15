import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Pencil } from 'lucide-react'
import { db } from '@/composables/useDB'
import { usePhotoStore, useUIStore, useShallow } from '@/store'
import { PhotoGrid } from '@/components/PhotoGrid'
import { PhotoMasonry } from '@/components/PhotoMasonry'
import { PhotoTimeline } from '@/components/PhotoTimeline'
import { PhotoViewer } from '@/components/PhotoViewer'
import { ProgressBar } from '@/components/ProgressBar'
import { Modal, type ModalAction } from '@/components/Modal'
import type { Photo, Person } from '@/types'
import styles from './PageStyles.module.css'

export function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { viewMode } = usePhotoStore(useShallow((s) => ({ viewMode: s.viewMode })))
  const batchProgress = useUIStore((s) => s.batchProgress)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [person, setPerson] = useState<Person | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')

  useEffect(() => {
    if (!id) return
    db.getAllPeople().then((list) => {
      const found = list.find((p) => p.id === id) ?? null
      setPerson(found)
      if (found) {
        setEditName(found.name)
        setEditNote(found.note)
      }
    })
    db.getFacesByPerson(id).then(async (faces) => {
      const photoIds = Array.from(new Set(faces.map((f) => f.photoId)))
      const result: Photo[] = []
      for (const pid of photoIds) {
        const p = await db.getPhoto(pid)
        if (p) result.push(p)
      }
      result.sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
      setPhotos(result)
    })
  }, [id])

  const saveEdit = async () => {
    if (!id) return
    await db.updatePerson(id, { name: editName.trim(), note: editNote })
    const list = await db.getAllPeople()
    const found = list.find((p) => p.id === id) ?? null
    setPerson(found)
    setEditing(false)
  }

  const editActions: ModalAction[] = [
    { label: '取消', onClick: () => setEditing(false) },
    { label: '保存', onClick: saveEdit, variant: 'primary' },
  ]

  const isUnnamed = person?.unnamedIndex != null
  const displayName = isUnnamed ? `未命名 ${person?.unnamedIndex}` : person?.name ?? '加载中...'

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
          onClick={() => navigate('/people')}
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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          {person?.thumbnail && (
            <img
              src={person.thumbnail}
              alt=""
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                objectFit: 'cover',
                filter: isUnnamed ? 'grayscale(100%)' : 'none',
                opacity: isUnnamed ? 0.6 : 1,
              }}
            />
          )}
          <div>
            <h1 style={{ fontSize: 20, color: isUnnamed ? 'var(--text-muted)' : undefined }}>{displayName}</h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {photos.length} 张照片
              {person?.note && !isUnnamed && ` · ${person.note}`}
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            cursor: 'pointer',
            background: 'none',
            border: '1px solid var(--border)',
          }}
        >
          <Pencil size={14} /> 编辑
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.content}>
          {photos.length === 0 ? (
            <div className={styles.empty}>
              <h2 className={styles.emptyTitle}>还没有照片</h2>
              <p className={styles.emptyText}>该人物分组下暂无照片。</p>
            </div>
          ) : (
            renderView()
          )}
        </div>
      </div>

      <Modal open={editing} title="编辑人物信息" onClose={() => setEditing(false)} actions={editActions}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>姓名</div>
            <input
              type="text"
              className={styles.input}
              placeholder="人物姓名"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>备注</div>
            <textarea
              className={styles.input}
              placeholder="自由文本备注"
              rows={3}
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>
        </div>
      </Modal>

      <PhotoViewer />
    </div>
  )
}
