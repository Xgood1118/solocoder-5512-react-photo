import { useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePhotoStore, useUIStore } from '@/store'
import { useDB } from '@/composables/useDB'
import { useBatchOperations } from '@/hooks/useBatchOperations'
import { Toolbar } from '@/components/Toolbar'
import { PhotoGrid } from '@/components/PhotoGrid'
import { PhotoMasonry } from '@/components/PhotoMasonry'
import { PhotoTimeline } from '@/components/PhotoTimeline'
import { TagTree } from '@/components/TagTree'
import { Modal, type ModalAction } from '@/components/Modal'
import { ImportDropzone } from '@/components/ImportDropzone'
import { DuplicateDialog } from '@/components/DuplicateDialog'
import { ProgressBar } from '@/components/ProgressBar'
import { PhotoViewer } from '@/components/PhotoViewer'
import type { Photo, Tag } from '@/types'
import styles from './PageStyles.module.css'

export function PhotoLibrary() {
  const navigate = useNavigate()
  const db = useDB()
  const { batchAddTags, batchMoveToAlbum, batchDelete } = useBatchOperations()

  const { photos, viewMode, searchQuery, selectedPhotoIds, tags, albums, setPhotos, setTags, setAlbums } =
    usePhotoStore()
  const batchProgress = useUIStore((s) => s.batchProgress)
  const importOpen = useUIStore((s) => s.importOpen)
  const setImportOpen = useUIStore((s) => s.setImportOpen)

  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagParent, setNewTagParent] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)

  useEffect(() => {
    db.getAllPhotos().then(setPhotos)
    db.getAllTags().then(setTags)
    db.getAllAlbums().then(setAlbums)
  }, [db, setPhotos, setTags, setAlbums])

  const filteredPhotos: Photo[] = photos.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p.fileName.toLowerCase().includes(q)) return false
    }
    return true
  })

  const photoCounts = new Map<string, number>()
  for (const p of photos) {
    // 粗略计数，实际可通过 photoTags 查询
  }

  const openTagBatchDialog = () => {
    setSelectedTagIds(new Set())
    setTagDialogOpen(true)
  }

  const openAlbumBatchDialog = () => {
    setSelectedAlbumId(null)
    setAlbumDialogOpen(true)
  }

  const confirmAddTags = async () => {
    const ids = Array.from(selectedPhotoIds)
    const tids = Array.from(selectedTagIds)
    if (tids.length > 0) {
      await batchAddTags(ids, tids)
    }
    setTagDialogOpen(false)
  }

  const confirmMoveAlbum = async () => {
    const ids = Array.from(selectedPhotoIds)
    await batchMoveToAlbum(ids, selectedAlbumId)
    setAlbumDialogOpen(false)
  }

  const confirmDelete = async () => {
    const ids = Array.from(selectedPhotoIds)
    await batchDelete(ids)
    setDeleteConfirmOpen(false)
  }

  const addNewTag = async () => {
    if (!newTagName.trim()) return
    const tag = await db.addTag(newTagName.trim(), newTagParent)
    const allTags = await db.getAllTags()
    setTags(allTags)
    setSelectedTagIds((prev) => new Set([...prev, tag.id]))
    setNewTagName('')
    setNewTagParent(null)
  }

  const tagActions: ModalAction[] = [
    { label: '取消', onClick: () => setTagDialogOpen(false) },
    { label: '添加标签', onClick: confirmAddTags, variant: 'primary' },
  ]

  const albumActions: ModalAction[] = [
    { label: '取消', onClick: () => setAlbumDialogOpen(false) },
    { label: '移动', onClick: confirmMoveAlbum, variant: 'primary' },
  ]

  const deleteActions: ModalAction[] = [
    { label: '取消', onClick: () => setDeleteConfirmOpen(false) },
    {
      label: `删除 ${selectedPhotoIds.size} 张照片`,
      onClick: confirmDelete,
      variant: 'danger',
    },
  ]

  const importActions: ModalAction[] = [{ label: '关闭', onClick: () => setImportOpen(false) }]

  const renderView = () => {
    switch (viewMode) {
      case 'masonry':
        return <PhotoMasonry photos={filteredPhotos} />
      case 'timeline':
        return <PhotoTimeline photos={filteredPhotos} />
      case 'grid':
      default:
        return <PhotoGrid photos={filteredPhotos} />
    }
  }

  return (
    <div className={styles.page}>
      {batchProgress && (
        <ProgressBar
          progress={batchProgress.done}
          total={batchProgress.total}
          topBar
        />
      )}
      <Toolbar
        onImport={() => setImportOpen(true)}
        onBatchTag={openTagBatchDialog}
        onBatchAlbum={openAlbumBatchDialog}
        onBatchDelete={() => setDeleteConfirmOpen(true)}
      />
      <div className={styles.body}>
        <div className={styles.content}>
          {photos.length === 0 ? (
            <div className={styles.empty}>
              <ImagePlus size={64} className={styles.emptyIcon} strokeWidth={1} />
              <h2 className={styles.emptyTitle}>还没有照片</h2>
              <p className={styles.emptyText}>
                点击右上角导入按钮，把散落在各处的照片导入进来，本地存储，绝对隐私。
              </p>
              <button className={styles.importBtn} onClick={() => navigate('/import')}>
                开始导入
              </button>
            </div>
          ) : (
            renderView()
          )}
        </div>
        <aside className={styles.tagPanel}>
          <div className={styles.tagPanelTitle}>
            <span>标签</span>
            <button className={styles.addBtn} onClick={openTagBatchDialog} title="新建标签">
              <span style={{ display: 'inline-flex' }}>+</span>
            </button>
          </div>
          <TagTree tags={tags} photoCounts={photoCounts} />
        </aside>
      </div>

      <Modal open={importOpen} title="导入照片" onClose={() => setImportOpen(false)} actions={importActions} width={640}>
        <ImportDropzone />
      </Modal>

      <Modal open={tagDialogOpen} title="批量添加标签" onClose={() => setTagDialogOpen(false)} actions={tagActions}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              已选择 {selectedPhotoIds.size} 张照片，选择要添加的标签：
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
              {tags.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
                  还没有标签，在下方创建
                </div>
              ) : (
                tags.map((t: Tag) => (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.has(t.id)}
                      onChange={(e) => {
                        setSelectedTagIds((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(t.id)
                          else next.delete(t.id)
                          return next
                        })
                      }}
                    />
                    <span style={{ fontSize: 13 }}>{t.path}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>创建新标签</div>
            <div className={styles.row}>
              <input
                type="text"
                className={styles.input}
                placeholder="标签名称（支持嵌套：2024/旅行）"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <select
                className={styles.select}
                value={newTagParent ?? ''}
                onChange={(e) => setNewTagParent(e.target.value || null)}
              >
                <option value="">顶级标签</option>
                {tags.map((t: Tag) => (
                  <option key={t.id} value={t.id}>
                    {t.path}
                  </option>
                ))}
              </select>
              <button
                onClick={addNewTag}
                style={{
                  padding: '8px 16px',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  borderRadius: 6,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={albumDialogOpen} title="批量移动到相册" onClose={() => setAlbumDialogOpen(false)} actions={albumActions}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            已选择 {selectedPhotoIds.size} 张照片，选择目标相册：
          </div>
          <select
            className={styles.select}
            value={selectedAlbumId ?? ''}
            onChange={(e) => setSelectedAlbumId(e.target.value || null)}
          >
            <option value="">（从相册中移除）</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}（{a.photoCount} 张）
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        title="确认删除"
        onClose={() => setDeleteConfirmOpen(false)}
        actions={deleteActions}
      >
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          确定要删除选中的 <strong style={{ color: 'var(--danger)' }}>{selectedPhotoIds.size}</strong> 张照片吗？
          <br />
          此操作不可撤销，照片将从本地存储中永久删除。
        </div>
      </Modal>

      <DuplicateDialog />
      <PhotoViewer />
    </div>
  )
}
