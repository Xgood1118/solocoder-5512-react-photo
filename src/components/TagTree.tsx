import { useState, useMemo } from 'react'
import { ChevronRight, Tag as TagIcon } from 'lucide-react'
import type { Tag } from '@/types'
import { usePhotoStore } from '@/store'
import styles from './TagTree.module.css'

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

interface TagTreeProps {
  tags: Tag[]
  photoCounts?: Map<string, number>
  onSelect?: (tagId: string | null) => void
  selectedId?: string | null
}

export function TagTree({ tags, photoCounts, onSelect, selectedId }: TagTreeProps) {
  const tree = useMemo(() => buildTree(tags), [tags])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeTagId = usePhotoStore((s) => s.activeTagId)
  const setActiveTagId = usePhotoStore((s) => s.setActiveTagId)
  const currentSelected = selectedId ?? activeTagId

  const renderNode = (node: TagNode): React.ReactNode => {
    const hasChildren = node.children.length > 0
    const isExpanded = expanded.has(node.tag.id)
    const count = photoCounts?.get(node.tag.id)

    return (
      <div key={node.tag.id}>
        <div
          className={`${styles.node} ${currentSelected === node.tag.id ? styles.active : ''}`}
          onClick={() => {
            const id = currentSelected === node.tag.id ? null : node.tag.id
            if (onSelect) onSelect(id)
            else setActiveTagId(id)
          }}
        >
          <span
            className={`${styles.caret} ${isExpanded ? styles.expanded : ''} ${hasChildren ? '' : styles.empty}`}
            onClick={(e) => toggle(node.tag.id, e)}
          >
            <ChevronRight size={14} />
          </span>
          <TagIcon size={14} className={styles.icon} />
          <span className={styles.label}>{node.tag.name}</span>
          {count != null && <span className={styles.count}>{count}</span>}
        </div>
        {hasChildren && isExpanded && <div className={styles.children}>{node.children.map(renderNode)}</div>}
      </div>
    )
  }

  if (tree.length === 0) {
    return <div className={styles.empty}>暂无标签，导入照片后可添加标签</div>
  }

  return <div className={styles.tagTree}>{tree.map(renderNode)}</div>
}
