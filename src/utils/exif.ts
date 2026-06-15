import * as exifr from 'exifr'

export interface ExifInfo {
  takenAt: Date | null
  make: string | null
  model: string | null
  gps: { latitude: number; longitude: number } | null
  exposureTime: string | null
  fNumber: number | null
  iso: number | null
  focalLength: number | null
  orientation: number
}

export async function readExif(file: File): Promise<ExifInfo> {
  try {
    const output = await exifr.parse(file, {
      translateValues: true,
      reviveValues: true,
    })

    let takenAt: Date | null = null
    if (output?.DateTimeOriginal) {
      takenAt = output.DateTimeOriginal instanceof Date ? output.DateTimeOriginal : new Date(output.DateTimeOriginal)
    } else if (output?.CreateDate) {
      takenAt = output.CreateDate instanceof Date ? output.CreateDate : new Date(output.CreateDate)
    }

    let gps: { latitude: number; longitude: number } | null = null
    if (output?.latitude != null && output?.longitude != null) {
      gps = { latitude: output.latitude, longitude: output.longitude }
    }

    return {
      takenAt,
      make: output?.Make ?? null,
      model: output?.Model ?? null,
      gps,
      exposureTime: output?.ExposureTime ?? output?.ShutterSpeedValue ?? null,
      fNumber: output?.FNumber ?? null,
      iso: output?.ISO ?? null,
      focalLength: output?.FocalLength ?? null,
      orientation: output?.Orientation ?? 1,
    }
  } catch {
    return {
      takenAt: null,
      make: null,
      model: null,
      gps: null,
      exposureTime: null,
      fNumber: null,
      iso: null,
      focalLength: null,
      orientation: 1,
    }
  }
}

export function applyOrientation(canvas: HTMLCanvasElement, orientation: number): HTMLCanvasElement {
  const width = canvas.width
  const height = canvas.height
  const ctx = canvas.getContext('2d')!
  const output = document.createElement('canvas')
  const outCtx = output.getContext('2d')!

  switch (orientation) {
    case 2:
      output.width = width
      output.height = height
      outCtx.translate(width, 0)
      outCtx.scale(-1, 1)
      break
    case 3:
      output.width = width
      output.height = height
      outCtx.translate(width, height)
      outCtx.rotate(Math.PI)
      break
    case 4:
      output.width = width
      output.height = height
      outCtx.translate(0, height)
      outCtx.scale(1, -1)
      break
    case 5:
      output.width = height
      output.height = width
      outCtx.rotate(0.5 * Math.PI)
      outCtx.scale(1, -1)
      break
    case 6:
      output.width = height
      output.height = width
      outCtx.rotate(0.5 * Math.PI)
      outCtx.translate(0, -height)
      break
    case 7:
      output.width = height
      output.height = width
      outCtx.rotate(0.5 * Math.PI)
      outCtx.translate(width, -height)
      outCtx.scale(-1, 1)
      break
    case 8:
      output.width = height
      output.height = width
      outCtx.rotate(-0.5 * Math.PI)
      outCtx.translate(-width, 0)
      break
    default:
      return canvas
  }

  outCtx.drawImage(canvas, 0, 0)
  return output
}
