import { Search, LayoutGrid, Columns, Clock, Upload, Trash2, Tag, FolderOpen } from 'lucide-react'
import { usePhotoStore, useUIStore, useShallow } from '@/store'
import type { ViewMode } from '@/types'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  onImport?: () => void
  onBatchTag?: () => void
  onBatchAlbum?: () => void
  onBatchDelete?: () => void
  showViewToggle?: boolean
  showSearch?: boolean
}

export function Toolbar({
  onImport,
  onBatchTag,
  onBatchAlbum,
  onBatchDelete,
  showViewToggle = true,
  showSearch = true,
}: ToolbarProps) {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, selectedPhotoIds, clearSelection } =
    usePhotoStore(
      useShallow((s) => ({
        viewMode: s.viewMode,
        setViewMode: s.setViewMode,
        searchQuery: s.searchQuery,
        setSearchQuery: s.setSearchQuery,
        selectedPhotoIds: s.selectedPhotoIds,
        clearSelection: s.clearSelection,
      })),
    )
  const setImportOpen = useUIStore((s) => s.setImportOpen)

  const views: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 'grid', icon: LayoutGrid, label: '网格' },
    { mode: 'masonry', icon: Columns, label: '瀑布' },
    { mode: 'timeline', icon: Clock, label: '时间线' },
  ]

  const hasSelection = selectedPhotoIds.size > 0

  return (
    <div className={styles.toolbar}>
      {showSearch && (
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.search}
            placeholder="搜索照片..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {showViewToggle && (
        <div className={styles.viewToggle}>
          {views.map((v) => (
            <button
              key={v.mode}
              className={`${styles.viewBtn} ${viewMode === v.mode ? styles.active : ''}`}
              onClick={() => setViewMode(v.mode)}
            >
              <v.icon size={16} />
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        {hasSelection ? (
          <>
            <div className={styles.selectionInfo}>已选择 {selectedPhotoIds.size} 张</div>
            {onBatchTag && (
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onBatchTag}>
                <Tag size={16} />
                标签
              </button>
            )}
            {onBatchAlbum && (
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onBatchAlbum}>
                <FolderOpen size={16} />
                相册
              </button>
            )}
            {onBatchDelete && (
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onBatchDelete}>
                <Trash2 size={16} />
                删除
              </button>
            )}
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={clearSelection}>
              取消
            </button>
          </>
        ) : (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onImport ?? (() => setImportOpen(true))}
          >
            <Upload size={16} />
            导入照片
          </button>
        )}
      </div>
    </div>
  )
}
