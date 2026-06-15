import { useUIStore, usePhotoStore } from '@/store'
import type { BatchOperationPayload } from '@/types'
import BatchWorker from '@/workers/batch.worker.ts?worker'

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new BatchWorker()
  }
  return worker
}

export function useBatchOperations() {

  async function runBatch(payload: BatchOperationPayload): Promise<void> {
    const worker = getWorker()
    const total = payload.photoIds.length

    useUIStore.getState().setBatchProgress({ done: 0, total })

    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        const { done, total, completed } = e.data
        useUIStore.getState().setBatchProgress({ done, total })
        if (completed) {
          worker.removeEventListener('message', handler)
          if (payload.type === 'delete') {
            const removeSet = new Set(payload.photoIds)
            const photos = usePhotoStore.getState().photos.filter((p) => !removeSet.has(p.id))
            usePhotoStore.getState().setPhotos(photos)
          }
          usePhotoStore.getState().clearSelection()
          setTimeout(() => {
            useUIStore.getState().setBatchProgress(null)
          }, 600)
          resolve()
        }
      }
      worker.addEventListener('message', handler)
      worker.postMessage(payload)
    })
  }

  async function batchAddTags(photoIds: string[], tagIds: string[]) {
    return runBatch({ type: 'addTags', photoIds, tagIds })
  }

  async function batchMoveToAlbum(photoIds: string[], albumId: string | null) {
    return runBatch({ type: 'moveToAlbum', photoIds, albumId })
  }

  async function batchDelete(photoIds: string[]) {
    return runBatch({ type: 'delete', photoIds })
  }

  return { runBatch, batchAddTags, batchMoveToAlbum, batchDelete }
}
