import { isHeic, convertHeicToJpeg } from '@/utils/heic'
import { readExif, ExifInfo, applyOrientation } from '@/utils/exif'
import { generateThumbnail, getImageDimensions, loadImage } from '@/utils/thumbnail'
import { computePHash } from '@/utils/phash'
import { db } from '@/composables/useDB'
import { usePhotoStore, useUIStore } from '@/store'
import type { Photo, ImportProgress, DuplicateAction, DuplicateCandidate } from '@/types'

interface ProcessedPhotoData {
  file: Blob
  exif: ExifInfo
  thumbnail: string
  phash: string
  width: number
  height: number
  fileName: string
  fileSize: number
  lastModified: Date
}

function waitForDuplicateResolve(candidate: DuplicateCandidate): Promise<DuplicateAction> {
  return new Promise((resolve) => {
    useUIStore.getState().showDuplicateDialog(candidate, (action) => {
      useUIStore.getState().hideDuplicateDialog()
      resolve(action)
    })
  })
}

async function processSingleFile(
  file: File,
  onStep: (step: ImportProgress['step']) => void,
): Promise<ProcessedPhotoData> {
  let workingBlob: Blob = file

  if (isHeic(file)) {
    onStep('decode')
    workingBlob = await convertHeicToJpeg(file)
  }

  onStep('exif')
  const exif = await readExif(file)

  onStep('thumbnail')
  const url = URL.createObjectURL(workingBlob)
  const img = await loadImage(url)
  URL.revokeObjectURL(url)

  let orientedImg: HTMLImageElement | HTMLCanvasElement = img
  if (exif.orientation > 1) {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    const orientedCanvas = applyOrientation(canvas, exif.orientation)
    orientedImg = orientedCanvas
  }

  const thumbnail = await generateThumbnail(orientedImg, 256, 0.7)
  const dims =
    exif.orientation >= 5 && exif.orientation <= 8
      ? { width: img.height, height: img.width }
      : { width: img.width, height: img.height }

  onStep('phash')
  const phash = await computePHash(orientedImg)

  return {
    file: workingBlob,
    exif,
    thumbnail,
    phash,
    width: dims.width,
    height: dims.height,
    fileName: file.name,
    fileSize: file.size,
    lastModified: new Date(file.lastModified),
  }
}

export function usePhotoImport() {
  async function importFiles(files: FileList | File[]): Promise<Photo[]> {
    const fileArr = Array.from(files)
    const validFiles = fileArr.filter((f) => {
      const lower = f.name.toLowerCase()
      return (
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.heic') ||
        lower.endsWith('.heif')
      )
    })

    if (validFiles.length === 0) return []

    useUIStore.getState().setImportOpen(true)
    const imported: Photo[] = []
    const total = validFiles.length

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const emit = (step: ImportProgress['step']) => {
        useUIStore.getState().setImportProgress({
          current: i + (step === 'done' ? 1 : 0),
          total,
          fileName: file.name,
          step,
        })
      }

      try {
        emit('decode')
        const data = await processSingleFile(file, emit)

        emit('dedup')
        const existing = await db.findDuplicateByPhash(data.phash)

        let action: DuplicateAction = 'keep'
        if (existing) {
          const candidate: DuplicateCandidate = {
            existingPhoto: existing,
            newFile: {
              name: data.fileName,
              size: data.fileSize,
              lastModified: data.lastModified,
              thumbnailPreview: data.thumbnail,
            },
            hammingDistance: 0,
          }
          action = await waitForDuplicateResolve(candidate)
        }

        if (action === 'skip') {
          emit('done')
          continue
        }

        emit('save')
        if (action === 'overwrite' && existing) {
          await db.deletePhoto(existing.id)
        }

        const takenAt = data.exif.takenAt ?? data.lastModified
        const photo = await db.addPhoto(data.file, {
          fileName: data.fileName,
          fileSize: data.fileSize,
          takenAt,
          importedAt: new Date(),
          albumId: null,
          thumbnail: data.thumbnail,
          phash: data.phash,
          width: data.width,
          height: data.height,
          exifData: JSON.stringify(data.exif),
          faceGroupIds: [],
        })

        usePhotoStore.getState().addPhoto(photo)
        imported.push(photo)
        emit('done')
      } catch (err) {
        console.error(`导入 ${file.name} 失败:`, err)
      }
    }

    setTimeout(() => {
      useUIStore.getState().setImportOpen(false)
      useUIStore.getState().setImportProgress(null)
    }, 800)

    return imported
  }

  return { importFiles }
}
