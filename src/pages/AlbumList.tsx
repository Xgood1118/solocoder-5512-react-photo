import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, MoreVertical, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import { useDB } from '@/composables/useDB'
import { usePhotoStore } from '@/store'
import type { Album } from '@/types'
import { Modal, type ModalAction } from '@/components/Modal'
import { PhotoViewer } from '@/components/PhotoViewer'
import { DuplicateDialog } from '@/components/DuplicateDialog'
import { ProgressBar } from '@/components/ProgressBar'
import { useUIStore } from '@/store'
import styles from './PageStyles.module.css'

const albumCard = {
  container: {
    position: 'relative' as const,
    borderRadius: 12,
    overflow: 'hidden' as const,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cover: {
    width: '100%',
    aspectRatio: '4 / 3',
    background: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  placeholder: {
    color: 'var(--text-muted)',
  },
  info: {
    padding: 12,
  },
  name: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 2,
  },
  count: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  menuBtn: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.15s',
    cursor: 'pointer',
  },
}

export function AlbumList() {
  const navigate = useNavigate()
  const db = useDB()
  const { albums, setAlbums } = usePhotoStore()
  const batchProgress = useUIStore((s) => s.batchProgress)

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    db.getAllAlbums().then(setAlbums)
  }, [db, setAlbums])

  const createAlbum = async () => {
    if (!newName.trim()) return
    await db.addAlbum(newName.trim())
    const list = await db.getAllAlbums()
    setAlbums(list)
    setNewName('')
    setCreateOpen(false)
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    await db.updateAlbum(editingId, { name: editName.trim() })
    const list = await db.getAllAlbums()
    setAlbums(list)
    setEditingId(null)
    setEditName('')
  }

  const deleteAlbum = async (id: string) => {
    await db.deleteAlbum(id)
    const list = await db.getAllAlbums()
    setAlbums(list)
    setMenuOpen(null)
  }

  const createActions: ModalAction[] = [
    { label: '取消', onClick: () => setCreateOpen(false) },
    { label: '创建', onClick: createAlbum, variant: 'primary' },
  ]

  const editActions: ModalAction[] = [
    { label: '取消', onClick: () => setEditingId(null) },
    { label: '保存', onClick: saveEdit, variant: 'primary' },
  ]

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
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          zIndex: 10,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>相册</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            共 {albums.length} 个相册
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            padding: '8px 16px',
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            borderRadius: 6,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: 14,
          }}
        >
          <Plus size={16} />
          新建相册
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {albums.length === 0 ? (
          <div className={styles.empty}>
            <FolderOpen size={64} style={{ opacity: 0.3 }} strokeWidth={1} />
            <h2 className={styles.emptyTitle}>还没有相册</h2>
            <p className={styles.emptyText}>创建相册来整理你的照片，比如「旅行」「家人」「朋友」等。</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20,
            }}
          >
            {albums.map((album: Album) => (
              <div
                key={album.id}
                style={albumCard.container}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                onClick={() => navigate(`/albums/${album.id}`)}
              >
                <button
                  style={albumCard.menuBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(menuOpen === album.id ? null : album.id)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                    const parent = e.currentTarget.closest('[style*="position: relative"]') as HTMLElement
                    if (parent) {
                      const btn = parent.querySelector('[data-menu-btn]') as HTMLElement
                      if (btn) btn.style.opacity = '1'
                    }
                  }}
                >
                  <MoreVertical size={16} />
                </button>
                <div style={albumCard.cover}>
                  {album.coverPhotoId ? (
                    <div style={albumCard.placeholder}>
                      <ImageIcon size={32} />
                    </div>
                  ) : (
                    <div style={albumCard.placeholder}>
                      <FolderOpen size={36} />
                    </div>
                  )}
                </div>
                <div style={albumCard.info}>
                  <div style={albumCard.name}>{album.name}</div>
                  <div style={albumCard.count}>{album.photoCount} 张照片</div>
                </div>

                {menuOpen === album.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 44,
                      right: 8,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 4,
                      minWidth: 140,
                      boxShadow: 'var(--shadow-md)',
                      zIndex: 5,
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingId(album.id)
                        setEditName(album.name)
                        setMenuOpen(null)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={14} /> 重命名
                    </button>
                    <button
                      onClick={() => deleteAlbum(album.id)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: 'var(--danger)',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} /> 删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={createOpen} title="新建相册" onClose={() => setCreateOpen(false)} actions={createActions}>
        <input
          type="text"
          className={styles.input}
          placeholder="相册名称"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          autoFocus
        />
      </Modal>

      <Modal open={editingId !== null} title="重命名相册" onClose={() => setEditingId(null)} actions={editActions}>
        <input
          type="text"
          className={styles.input}
          placeholder="相册名称"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          autoFocus
        />
      </Modal>

      <DuplicateDialog />
      <PhotoViewer />
    </div>
  )
}
