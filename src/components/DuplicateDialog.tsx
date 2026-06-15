import { useUIStore } from '@/store'
import { Modal, type ModalAction } from './Modal'
import type { DuplicateAction } from '@/types'
import styles from './DuplicateDialog.module.css'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DuplicateDialog() {
  const dialog = useUIStore((s) => s.duplicateDialog)
  const hide = useUIStore((s) => s.hideDuplicateDialog)

  if (!dialog || !dialog.open || !dialog.candidate || !dialog.onResolve) return null

  const { existingPhoto, newFile } = dialog.candidate
  const resolve = (action: DuplicateAction) => {
    dialog.onResolve!(action)
  }

  const actions: ModalAction[] = [
    { label: '跳过', onClick: () => resolve('skip') },
    { label: '都保留', onClick: () => resolve('keep'), variant: 'secondary' },
    { label: '覆盖已有', onClick: () => resolve('overwrite'), variant: 'danger' },
  ]

  return (
    <Modal open title="检测到重复照片" onClose={hide} actions={actions} width={640}>
      <div className={styles.dialog}>
        <div className={styles.compare}>
          <div className={styles.photoCard}>
            <span className={styles.photoLabel}>已存在</span>
            <img src={existingPhoto.thumbnail} alt="" className={styles.thumb} />
            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>文件名</span>
                <span className={styles.metaValue}>{existingPhoto.fileName}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>大小</span>
                <span className={styles.metaValue}>{formatSize(existingPhoto.fileSize)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>拍摄时间</span>
                <span className={styles.metaValue}>{formatDate(existingPhoto.takenAt)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>分辨率</span>
                <span className={styles.metaValue}>
                  {existingPhoto.width}×{existingPhoto.height}
                </span>
              </div>
            </div>
          </div>

          <span className={styles.vs}>VS</span>

          <div className={styles.photoCard}>
            <span className={styles.photoLabel}>新导入</span>
            <img src={newFile.thumbnailPreview} alt="" className={styles.thumb} />
            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>文件名</span>
                <span className={styles.metaValue}>{newFile.name}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>大小</span>
                <span className={styles.metaValue}>{formatSize(newFile.size)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>修改时间</span>
                <span className={styles.metaValue}>{formatDate(newFile.lastModified)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.hint}>
          两张照片感知哈希匹配，可能是同一张照片的不同版本。请选择处理方式。
        </div>
      </div>
    </Modal>
  )
}
