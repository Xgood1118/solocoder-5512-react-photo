import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, FolderPlus, ChevronRight, ChevronDown, Tag as TagIcon } from 'lucide-react'
import { useDB } from '@/composables/useDB'
import { usePhotoStore } from '@/store'
import { TagTree } from '@/components/TagTree'
import { Modal, type ModalAction } from '@/components/Modal'
import type { Tag } from '@/types'
import styles from './PageStyles.module.css'

interface TagNode {
  tag: Tag
  children: TagNode[]
}

function buildTree(tags: Tag[]): TagNode[] {
  const map = new Map<string, TagNode>()
  for (const t of tags) {
    map.set(t.id, { tag: t, children: [] })
  }
  const roots: TagNode[] = []
  for (const node of map.values()) {
    if (node.tag.parentId && map.has(node.tag.parentId)) {
      map.get(node.tag.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortNodes = (nodes: TagNode[]) => {
    nodes.sort((a, b) => a.tag.name.localeCompare(b.tag.name))
    for (const n of nodes) sortNodes(n.children)
  }
  sortNodes(roots)
  return roots
}

export function TagManager() {
  const db = useDB()
  const { tags, setTags } = usePhotoStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newParent, setNewParent] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    db.getAllTags().then(setTags)
  }, [db, setTags])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const createTag = async () => {
    if (!newName.trim()) return
    await db.addTag(newName.trim(), newParent)
    const list = await db.getAllTags()
    setTags(list)
    setNewName('')
    setNewParent(null)
    setCreateOpen(false)
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    await db.updateTag(editingId, { name: editName.trim() })
    const list = await db.getAllTags()
    setTags(list)
    setEditingId(null)
    setEditName('')
    setEditOpen(false)
  }

  const doDelete = async () => {
    if (!deleteOpen) return
    await db.deleteTag(deleteOpen)
    const list = await db.getAllTags()
    setTags(list)
    setDeleteOpen(null)
  }

  const createActions: ModalAction[] = [
    { label: '取消', onClick: () => setCreateOpen(false) },
    { label: '创建', onClick: createTag, variant: 'primary' },
  ]

  const editActions: ModalAction[] = [
    { label: '取消', onClick: () => setEditOpen(false) },
    { label: '保存', onClick: saveEdit, variant: 'primary' },
  ]

  const deleteActions: ModalAction[] = [
    { label: '取消', onClick: () => setDeleteOpen(null) },
    { label: '删除', onClick: doDelete, variant: 'danger' },
  ]

  const deleteTarget = deleteOpen ? tags.find((t) => t.id === deleteOpen) : null

  return (
    <div className={styles.page}>
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
          <h1 style={{ fontSize: 24 }}>标签管理</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            共 {tags.length} 个标签，支持嵌套路径如「2024 / 旅行 / 日本」
          </div>
        </div>
        <button
          onClick={() => {
            setNewName('')
            setNewParent(null)
            setCreateOpen(true)
          }}
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
          新建标签
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tags.length === 0 ? (
          <div className={styles.empty}>
            <TagIcon size={64} style={{ opacity: 0.3 }} strokeWidth={1} />
            <h2 className={styles.emptyTitle}>还没有标签</h2>
            <p className={styles.emptyText}>
              创建标签来分类管理你的照片，支持嵌套结构，比如按年份/地点/事件来组织。
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {buildTree(tags).map(renderTagNode)}
          </div>
        )}
      </div>

      <Modal open={createOpen} title="新建标签" onClose={() => setCreateOpen(false)} actions={createActions}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>标签名称</div>
            <input
              type="text"
              className={styles.input}
              placeholder="例如：日本"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              支持用「/」创建嵌套路径，例如「2024/旅行/日本」
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>父标签（可选）</div>
            <select
              className={styles.select}
              value={newParent ?? ''}
              onChange={(e) => setNewParent(e.target.value || null)}
            >
              <option value="">（顶级标签）</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.path}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} title="重命名标签" onClose={() => setEditOpen(false)} actions={editActions}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            所有引用此标签的照片会自动同步更新。
          </div>
          <input
            type="text"
            className={styles.input}
            placeholder="新标签名称"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        open={deleteOpen !== null}
        title="删除标签"
        onClose={() => setDeleteOpen(null)}
        actions={deleteActions}
      >
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          确定要删除标签「<strong>{deleteTarget?.path}</strong>」吗？
          <br />
          所有子标签也会被一并删除，但照片本身不会被删除。
        </div>
      </Modal>
    </div>
  )

  function renderTagNode(node: TagNode): React.ReactNode {
    const hasChildren = node.children.length > 0
    const isExpanded = expanded.has(node.tag.id)
    return (
      <div key={node.tag.id}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <button
            onClick={() => toggleExpand(node.tag.id)}
            style={{
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              visibility: hasChildren ? 'visible' : 'hidden',
              transition: 'transform 0.15s',
              transform: isExpanded ? 'rotate(90deg)' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ChevronRight size={14} />
          </button>
          {hasChildren ? (
            <FolderPlus size={16} style={{ color: 'var(--accent)' }} />
          ) : (
            <TagIcon size={14} style={{ color: 'var(--text-muted)' }} />
          )}
          <span style={{ flex: 1, fontSize: 14 }}>{node.tag.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{node.tag.path}</span>
          <button
            onClick={() => {
              setEditingId(node.tag.id)
              setEditName(node.tag.name)
              setEditOpen(true)
            }}
            style={{
              padding: 4,
              borderRadius: 4,
              color: 'var(--text-muted)',
              display: 'flex',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
            title="重命名"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setDeleteOpen(node.tag.id)}
            style={{
              padding: 4,
              borderRadius: 4,
              color: 'var(--text-muted)',
              display: 'flex',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div style={{ marginLeft: 28, borderLeft: '1px solid var(--border)', paddingLeft: 8 }}>
            {node.children.map(renderTagNode)}
          </div>
        )}
      </div>
    )
  }
}
