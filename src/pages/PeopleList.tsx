import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Sparkles, Merge, Pencil, User as UserIcon, HelpCircle } from 'lucide-react'
import { db } from '@/composables/useDB'
import { usePhotoStore, useUIStore, useShallow } from '@/store'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import type { Person } from '@/types'
import { Modal, type ModalAction } from '@/components/Modal'
import { PhotoViewer } from '@/components/PhotoViewer'
import { ProgressBar } from '@/components/ProgressBar'
import styles from './PageStyles.module.css'

const personCard = {
  container: {
    borderRadius: 12,
    padding: 16,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative' as const,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'var(--bg-tertiary)',
    overflow: 'hidden' as const,
    margin: '0 auto 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid transparent',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  unnamedAvatar: {
    filter: 'grayscale(100%)',
    opacity: 0.6,
  },
  unnamedBadge: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -100%)',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--bg-tertiary)',
    border: '2px solid var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
  },
  name: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 2,
  },
  unnamedName: {
    color: 'var(--text-muted)',
  },
  count: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  checkbox: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 4,
    border: '2px solid var(--border-light)',
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

export function PeopleList() {
  const navigate = useNavigate()
  const { people, setPeople } = usePhotoStore(
    useShallow((s) => ({ people: s.people, setPeople: s.setPeople })),
  )
  const batchProgress = useUIStore((s) => s.batchProgress)
  const { runClustering, mergePeople } = useFaceDetection()

  const [mergeMode, setMergeMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')

  useEffect(() => {
    db.getAllPeople().then(setPeople)
  }, [])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startMerge = async () => {
    if (selectedIds.size < 2) return
    const ids = Array.from(selectedIds)
    const target = ids[0]
    const sources = ids.slice(1)
    await mergePeople(target, sources)
    setSelectedIds(new Set())
    setMergeMode(false)
  }

  const saveEdit = async () => {
    if (!editingId) return
    await db.updatePerson(editingId, { name: editName.trim(), note: editNote })
    const list = await db.getAllPeople()
    setPeople(list)
    setEditingId(null)
  }

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
          <h1 style={{ fontSize: 24 }}>人物</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            共 {people.length} 个人物分组
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {mergeMode ? (
            <>
              <div
                style={{
                  padding: '8px 14px',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(212,165,116,0.3)',
                  borderRadius: 6,
                  color: 'var(--accent)',
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                已选 {selectedIds.size} 个
              </div>
              <button
                onClick={() => {
                  setSelectedIds(new Set())
                  setMergeMode(false)
                }}
                style={cancelBtnStyle}
              >
                取消
              </button>
              <button
                onClick={startMerge}
                disabled={selectedIds.size < 2}
                style={{
                  ...primaryBtnStyle,
                  opacity: selectedIds.size < 2 ? 0.5 : 1,
                  cursor: selectedIds.size < 2 ? 'not-allowed' : 'pointer',
                }}
              >
                <Merge size={16} /> 合并
              </button>
            </>
          ) : (
            <>
              <button
                onClick={async () => {
                  await runClustering()
                }}
                style={primaryBtnStyle}
              >
                <Sparkles size={16} /> 检测人脸
              </button>
              {people.length >= 2 && (
                <button onClick={() => setMergeMode(true)} style={secondaryBtnStyle}>
                  <Merge size={16} /> 合并分组
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {people.length === 0 ? (
          <div className={styles.empty}>
            <Users size={64} style={{ opacity: 0.3 }} strokeWidth={1} />
            <h2 className={styles.emptyTitle}>还没有人物分组</h2>
            <p className={styles.emptyText}>
              导入照片后点击「检测人脸」，系统会自动识别人脸并分组。你可以为分组命名和合并。
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 20,
            }}
          >
            {people.map((p: Person) => {
              const isUnnamed = p.unnamedIndex != null
              const selected = selectedIds.has(p.id)
              return (
                <div
                  key={p.id}
                  style={{
                    ...personCard.container,
                    borderColor: mergeMode && selected ? 'var(--accent)' : undefined,
                    boxShadow: mergeMode && selected ? '0 0 0 2px var(--accent)' : undefined,
                  }}
                  onClick={() => (mergeMode ? toggleSelect(p.id) : navigate(`/people/${p.id}`))}
                >
                  {mergeMode && (
                    <div
                      style={{
                        ...personCard.checkbox,
                        background: selected ? 'var(--accent)' : 'rgba(0,0,0,0.3)',
                        borderColor: selected ? 'var(--accent)' : 'var(--border-light)',
                      }}
                    />
                  )}
                  <div style={{ position: 'relative' }}>
                    <div style={{ ...personCard.avatar, ...(isUnnamed ? personCard.unnamedAvatar : {}) }}>
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" style={personCard.avatarImg} />
                      ) : (
                        <UserIcon size={32} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    {isUnnamed && (
                      <div style={personCard.unnamedBadge}>
                        <HelpCircle size={12} />
                      </div>
                    )}
                  </div>
                  <div style={{ ...personCard.name, ...(isUnnamed ? personCard.unnamedName : {}) }}>
                    {isUnnamed ? `未命名 ${p.unnamedIndex}` : p.name}
                  </div>
                  {!isUnnamed && p.note && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{p.note}</div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(p.id)
                      setEditName(p.name)
                      setEditNote(p.note)
                    }}
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      padding: 4,
                      borderRadius: 4,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      background: 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={editingId !== null} title="编辑人物" onClose={() => setEditingId(null)} actions={editActions}>
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

const primaryBtnStyle: React.CSSProperties = {
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
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  borderRadius: 6,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
  border: '1px solid var(--border)',
  fontFamily: 'inherit',
  fontSize: 14,
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  borderRadius: 6,
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid var(--border)',
  fontFamily: 'inherit',
  fontSize: 14,
}
