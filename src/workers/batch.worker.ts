/// <reference lib="webworker" />
import { openDB, type IDBPDatabase } from 'idb'
import type {
  BatchOperationPayload,
  Photo,
  Album,
  Person,
  Tag,
  PhotoTag,
  Face,
} from '@/types'
import type { PhotoManagerDBSchema } from '@/utils/idb'

const ctx = self as unknown as Worker

let dbPromise: Promise<IDBPDatabase<PhotoManagerDBSchema>> | null = null

async function getDB(): Promise<IDBPDatabase<PhotoManagerDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<PhotoManagerDBSchema>('photo-manager', 1)
  }
  return dbPromise
}

async function ensurePhotosDir(): Promise<any> {
  if (!('storage' in (navigator as any)) || !('getDirectory' in (navigator as any).storage)) {
    throw new Error('OPFS not supported')
  }
  const root = await (navigator as any).storage.getDirectory()
  return root.getDirectoryHandle('photos', { create: true })
}

async function deletePhotoFile(photoId: string): Promise<void> {
  try {
    const dir = await ensurePhotosDir()
    await dir.removeEntry(photoId)
  } catch {
    // ignore
  }
}

ctx.addEventListener('message', async (e: MessageEvent<BatchOperationPayload>) => {
  const payload = e.data
  const db = await getDB()
  const { photoIds, type } = payload
  const total = photoIds.length
  const batchSize = 100

  for (let i = 0; i < photoIds.length; i += batchSize) {
    const batch = photoIds.slice(i, i + batchSize)
    for (const id of batch) {
      try {
        switch (type) {
          case 'addTags':
            if (payload.tagIds) {
              for (const tagId of payload.tagIds) {
                try {
                  await db.add('photoTags', { photoId: id, tagId })
                } catch {
                  // already exists
                }
              }
            }
            break
          case 'moveToAlbum':
            const existing = await db.get('photos', id)
            if (existing) {
              await db.put('photos', { ...existing, albumId: payload.albumId ?? null })
            }
            break
          case 'delete':
            const tx = db.transaction(['photos', 'photoTags', 'faces'], 'readwrite')
            await tx.objectStore('photos').delete(id)
            const photoTags = await tx.objectStore('photoTags').index('byPhoto').getAll(id)
            for (const pt of photoTags) {
              await tx.objectStore('photoTags').delete([pt.photoId, pt.tagId])
            }
            const faces = await tx.objectStore('faces').index('byPhoto').getAll(id)
            for (const f of faces) {
              await tx.objectStore('faces').delete(f.id)
            }
            await tx.done
            await deletePhotoFile(id)
            break
        }
      } catch (err) {
        console.error(`处理照片 ${id} 失败:`, err)
      }
    }
    const done = Math.min(i + batchSize, total)
    ctx.postMessage({ done, total, currentPhotoId: batch[batch.length - 1] ?? '' })
  }

  ctx.postMessage({ done: total, total, completed: true })
})

export {}
