// @ts-ignore
import heic2any from 'heic2any'

export function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  const ext = name.split('.').pop()
  return ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif'
}

export async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    })
    if (Array.isArray(result)) {
      return result[0]
    }
    return result as Blob
  } catch (err) {
    console.error('HEIC conversion failed:', err)
    throw new Error('HEIC 转码失败')
  }
}
