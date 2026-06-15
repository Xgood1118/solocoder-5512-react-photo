import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  progress: number
  total: number
  label?: string
  indeterminate?: boolean
  topBar?: boolean
}

export function ProgressBar({ progress, total, label, indeterminate, topBar }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, (progress / total) * 100) : 0

  if (topBar) {
    return (
      <div className={styles.topBar}>
        <div className={styles.bar}>
          <div
            className={`${styles.fill} ${indeterminate ? styles.indeterminate : ''}`}
            style={{ width: indeterminate ? undefined : `${percent}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {(label || total > 0) && (
        <div className={styles.meta}>
          {label && <span className={styles.label}>{label}</span>}
          {total > 0 && <span className={styles.percent}>{Math.round(percent)}%</span>}
        </div>
      )}
      <div className={styles.bar}>
        <div
          className={`${styles.fill} ${indeterminate ? styles.indeterminate : ''}`}
          style={{ width: indeterminate ? undefined : `${percent}%` }}
        />
      </div>
    </div>
  )
}
