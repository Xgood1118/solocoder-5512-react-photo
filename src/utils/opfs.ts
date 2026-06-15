let rootHandlePromise: Promise<any> | null = null

async function getRoot(): Promise<any> {
  if (!rootHandlePromise) {
    if (!('storage' in navigator) || !('getDirectory' in (navigator as any).storage)) {
      throw new Error('当前浏览器不支持 OPFS (Origin Private File System)')
    }
    rootHandlePromise = (navigator as any).storage.getDirectory()
  }
  return rootHandlePromise
}

async function ensurePhotosDir(): Promise<FileSystemDirectoryHandle> {
  const root = await getRoot()
  return root.getDirectoryHandle('photos', { create: true })
}

export async function writePhotoFile(photoId: string, blob: Blob): Promise<void> {
  const dir = await ensurePhotosDir()
  const fileHandle = await dir.getFileHandle(photoId, { create: true })
  const writable = await (fileHandle as any).createWritable()
  await writable.write(blob)
  await writable.close()
}

export async function readPhotoFile(photoId: string): Promise<Blob> {
  const dir = await ensurePhotosDir()
  try {
    const fileHandle = await dir.getFileHandle(photoId)
    const file = await (fileHandle as any).getFile()
    return file as Blob
  } catch {
    throw new Error(`照片文件不存在: ${photoId}`)
  }
}

export async function deletePhotoFile(photoId: string): Promise<void> {
  const dir = await ensurePhotosDir()
  try {
    await dir.removeEntry(photoId)
  } catch {
    // 忽略不存在的错误
  }
}

export async function photoFileExists(photoId: string): Promise<boolean> {
  const dir = await ensurePhotosDir()
  try {
    await dir.getFileHandle(photoId)
    return true
  } catch {
    return false
  }
}
