export async function generateThumbnail(
  source: HTMLImageElement | HTMLCanvasElement | File | Blob,
  size = 256,
  quality = 0.7,
): Promise<string> {
  let drawSource: HTMLImageElement | HTMLCanvasElement
  if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
    drawSource = source
  } else {
    const url = URL.createObjectURL(source)
    drawSource = await loadImage(url)
    URL.revokeObjectURL(url)
  }
  const img = drawSource as HTMLImageElement & HTMLCanvasElement

  const scale = size / Math.max(img.width, img.height)
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)

  return canvas.toDataURL('image/jpeg', quality)
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file)
  const img = await loadImage(url)
  URL.revokeObjectURL(url)
  return { width: img.width, height: img.height }
}
