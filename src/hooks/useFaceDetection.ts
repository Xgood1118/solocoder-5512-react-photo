import { db } from '@/composables/useDB'
import { usePhotoStore } from '@/store'
import { dbscan } from '@/utils/dbscan'

export function useFaceDetection() {
  async function runClustering(): Promise<void> {
    const allFaces = await db.getAllFaces()
    if (allFaces.length === 0) return

    const points = allFaces.map((f) => ({ id: f.id, vector: f.descriptor }))
    const { clusters } = dbscan(points, 0.6, 2)

    let nextIdx = await db.getNextUnnamedIndex()
    for (const cluster of clusters) {
      const firstFace = allFaces.find((f) => f.id === cluster[0])
      if (!firstFace) continue

      const photo = await db.getPhoto(firstFace.photoId)
      const thumb = photo?.thumbnail ?? ''
      const person = await db.addPerson(`未命名 ${nextIdx}`, thumb, firstFace.photoId)
      nextIdx++

      for (const fid of cluster) {
        await db.updateFacePerson(fid, person.id)
      }
    }

    const people = await db.getAllPeople()
    usePhotoStore.getState().setPeople(people)
  }

  async function mergePeople(targetId: string, sourceIds: string[]) {
    await db.mergePersons(targetId, sourceIds)
    const people = await db.getAllPeople()
    usePhotoStore.getState().setPeople(people)
  }

  return { runClustering, mergePeople }
}
