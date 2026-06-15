import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react'
import { Upload, CheckCircle2 } from 'lucide-react'
import { useUIStore } from '@/store'
import { usePhotoImport } from '@/hooks/usePhotoImport'
import { ProgressBar } from './ProgressBar'
import type { ImportProgress } from '@/types'
import styles from './ImportDropzone.module.css'

const stepLabels: Record<ImportProgress['step'], string> = {
  decode: '解码 HEIC',
  exif: '读取 EXIF',
  thumbnail: '生成缩略图',
  phash: '计算指纹',
  dedup: '查重比对',
  save: '保存中',
  done: '完成',
}

export function ImportDropzone() {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const importProgress = useUIStore((s) => s.importProgress)
  const { importFiles } = usePhotoImport()

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      await importFiles(files)
    },
    [importFiles],
  )

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }

  const onClick = () => inputRef.current?.click()

  const isProcessing = importProgress != null
  const isDone = importProgress?.step === 'done' && importProgress.current === importProgress.total

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={isProcessing ? undefined : onClick}
    >
      {isDone ? (
        <>
          <CheckCircle2 className={styles.doneIcon} strokeWidth={1.5} />
          <h3 className={styles.title}>导入完成</h3>
          <p className={styles.hint}>
            成功导入 {importProgress!.total} 张照片
          </p>
          <button className={styles.btn} onClick={onClick}>
            继续导入
          </button>
        </>
      ) : isProcessing ? (
        <div className={styles.progressWrap}>
          <span className={styles.stepLabel}>
            {stepLabels[importProgress!.step]}：{importProgress!.fileName}
          </span>
          <ProgressBar progress={importProgress!.current} total={importProgress!.total} />
          <div className={styles.stats}>
            <span>
              {importProgress!.current} / {importProgress!.total}
            </span>
            <span>
              {Math.round((importProgress!.current / importProgress!.total) * 100)}%
            </span>
          </div>
        </div>
      ) : (
        <>
          <Upload className={styles.icon} strokeWidth={1.2} />
          <h3 className={styles.title}>拖入照片，或点击选择</h3>
          <p className={styles.hint}>支持 JPEG / PNG / WebP / HEIC 格式，所有数据保存在本地浏览器</p>
          <button className={styles.btn}>选择文件</button>
          <p className={styles.formats}>
            HEIC 照片将在浏览器本地转码为 JPEG，不会上传到任何服务器
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        onChange={onInputChange}
        className={styles.hiddenInput}
      />
    </div>
  )
}
