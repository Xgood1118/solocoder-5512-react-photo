import { useDB } from '@/composables/useDB'
import { ImportDropzone } from '@/components/ImportDropzone'
import { DuplicateDialog } from '@/components/DuplicateDialog'
import { PhotoViewer } from '@/components/PhotoViewer'
import { ProgressBar } from '@/components/ProgressBar'
import { useUIStore } from '@/store'
import { Upload } from 'lucide-react'
import styles from './PageStyles.module.css'

export function ImportPage() {
  const batchProgress = useUIStore((s) => s.batchProgress)

  return (
    <div className={styles.page}>
      {batchProgress && (
        <ProgressBar progress={batchProgress.done} total={batchProgress.total} topBar />
      )}
      <div style={{ padding: '32px 48px', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: 32, maxWidth: 760, margin: '0 auto 32px' }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>导入照片</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            将照片拖入下方区域，或点击选择文件。支持 JPEG、PNG、WebP、HEIC 四种格式。
            <br />
            所有处理均在浏览器本地完成，照片不会上传到任何服务器。
          </p>
        </div>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <ImportDropzone />
        </div>
        <div
          style={{
            maxWidth: 760,
            margin: '32px auto 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {[
            { title: '读取 EXIF', desc: '提取拍摄时间、相机型号、GPS 等元信息' },
            { title: '生成缩略图', desc: '256×256 JPEG，浏览时快速加载' },
            { title: '智能查重', desc: '感知哈希比对，避免重复导入' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 16,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'var(--accent-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  marginBottom: 10,
                }}
              >
                <Upload size={16} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
      <DuplicateDialog />
      <PhotoViewer />
    </div>
  )
}
