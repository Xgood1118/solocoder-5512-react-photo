import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useUIStore, useShallow } from '@/store'
import { db } from '@/composables/useDB'
import styles from './PhotoViewer.module.css'

export function PhotoViewer() {
  const { viewerOpen, viewerPhotoId, viewerPhotoList, viewerRotation, closeViewer, setViewerRotation } =
    useUIStore(
      useShallow((s) => ({
        viewerOpen: s.viewerOpen,
        viewerPhotoId: s.viewerPhotoId,
        viewerPhotoList: s.viewerPhotoList,
        viewerRotation: s.viewerRotation,
        closeViewer: s.closeViewer,
        setViewerRotation: s.setViewerRotation,
      })),
    )
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const currentIndex = viewerPhotoList.findIndex((p) => p.id === viewerPhotoId)
  const currentPhoto = currentIndex >= 0 ? viewerPhotoList[currentIndex] : null

  const loadPhoto = useCallback(async () => {
    if (!viewerPhotoId) return
    try {
      const url = await db.getPhotoURL(viewerPhotoId)
      setImgUrl(url)
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    } catch (err) {
      console.error('加载原图失败:', err)
    }
  }, [viewerPhotoId])

  useEffect(() => {
    if (viewerOpen) {
      loadPhoto()
    } else {
      if (viewerPhotoId) {
        db.revokePhotoURL(viewerPhotoId)
      }
      setImgUrl(null)
    }
    return () => {
      if (viewerPhotoId) {
        db.revokePhotoURL(viewerPhotoId)
      }
    }
  }, [viewerOpen, loadPhoto, viewerPhotoId])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      const nextPhoto = viewerPhotoList[currentIndex - 1]
      if (viewerPhotoId) db.revokePhotoURL(viewerPhotoId)
      useUIStore.getState().openViewer(nextPhoto.id, viewerPhotoList)
    }
  }, [currentIndex, viewerPhotoList, viewerPhotoId])

  const goNext = useCallback(() => {
    if (currentIndex < viewerPhotoList.length - 1) {
      const nextPhoto = viewerPhotoList[currentIndex + 1]
      if (viewerPhotoId) db.revokePhotoURL(viewerPhotoId)
      useUIStore.getState().openViewer(nextPhoto.id, viewerPhotoList)
    }
  }, [currentIndex, viewerPhotoList, viewerPhotoId])

  useEffect(() => {
    if (!viewerOpen) return
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeViewer()
          break
        case 'ArrowLeft':
          goPrev()
          break
        case 'ArrowRight':
          goNext()
          break
        case '+':
        case '=':
          setScale((s) => Math.min(5, s + 0.25))
          break
        case '-':
          setScale((s) => Math.max(0.25, s - 0.25))
          break
        case '0':
          setScale(1)
          setTranslate({ x: 0, y: 0 })
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [viewerOpen, goPrev, goNext, closeViewer])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setScale((s) => Math.max(0.25, Math.min(5, s + delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setDragging(true)
      dragStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setTranslate({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
    }
  }

  const handleMouseUp = () => {
    setDragging(false)
  }

  const rotateLeft = () => setViewerRotation((viewerRotation - 90 + 360) % 360)
  const rotateRight = () => setViewerRotation((viewerRotation + 90) % 360)
  const zoomIn = () => setScale((s) => Math.min(5, s + 0.5))
  const zoomOut = () => setScale((s) => Math.max(0.25, s - 0.5))
  const resetView = () => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
    setViewerRotation(0)
  }

  if (!viewerOpen || !currentPhoto) return null

  const takenAt = new Date(currentPhoto.takenAt)
  const metaInfo = `${takenAt.toLocaleString('zh-CN')} · ${currentPhoto.width}×${currentPhoto.height}`

  return (
    <div className={styles.viewer}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.fileName}>{currentPhoto.fileName}</div>
          <div className={styles.metaInfo}>{metaInfo}</div>
        </div>
        <div className={styles.topActions}>
          <button className={styles.iconBtn} onClick={closeViewer} title="关闭 (Esc)">
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        className={styles.stage}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <button
          className={`${styles.navBtn} ${styles.prev}`}
          onClick={goPrev}
          disabled={currentIndex <= 0}
          title="上一张 (←)"
        >
          <ChevronLeft size={24} />
        </button>

        {imgUrl && (
          <img
            src={imgUrl}
            alt={currentPhoto.fileName}
            className={styles.canvas}
            draggable={false}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale}) rotate(${viewerRotation}deg)`,
              cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
            }}
          />
        )}

        <button
          className={`${styles.navBtn} ${styles.next}`}
          onClick={goNext}
          disabled={currentIndex >= viewerPhotoList.length - 1}
          title="下一张 (→)"
        >
            <ChevronRight size={24} />
        </button>
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.iconBtn} onClick={zoomOut} title="缩小 (-)">
          <ZoomOut size={18} />
        </button>
        <button className={styles.iconBtn} onClick={resetView} title="重置视图 (0)">
          <Maximize2 size={18} />
        </button>
        <button className={styles.iconBtn} onClick={zoomIn} title="放大 (+)">
          <ZoomIn size={18} />
        </button>
        <button className={styles.iconBtn} onClick={rotateLeft} title="逆时针旋转">
          <RotateCcw size={18} />
        </button>
        <button className={styles.iconBtn} onClick={rotateRight} title="顺时针旋转">
          <RotateCw size={18} />
        </button>
        <span className={styles.counter}>
          {currentIndex + 1} / {viewerPhotoList.length}
        </span>
      </div>
    </div>
  )
}
