import { getDB } from '@/utils/idb'
import { writePhotoFile, readPhotoFile, deletePhotoFile } from '@/utils/opfs'
import type { Photo, Album, Person, Tag, Face } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const activeBlobUrls = new Map<string, string>()

function revIfExists(id: string) {
  const url = activeBlobUrls.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    activeBlobUrls.delete(id)
  }
}

async function addPhoto(file: Blob, metadata: Omit<Photo, 'id'>): Promise<Photo> {
  const db = await getDB()
  const id = uuidv4()
  const photo: Photo = { ...metadata, id }
  await writePhotoFile(id, file)
  await db.add('photos', photo)
  return photo
}

async function updatePhoto(id: string, changes: Partial<Photo>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('photos', id)
  if (!existing) return
  await db.put('photos', { ...existing, ...changes })
}

async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await getDB()
  return db.get('photos', id)
}

async function getAllPhotos(): Promise<Photo[]> {
  const db = await getDB()
  const photos = await db.getAll('photos')
  return photos.sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
}

async function getPhotosByAlbum(albumId: string): Promise<Photo[]> {
  const db = await getDB()
  const photos = await db.getAllFromIndex('photos', 'byAlbum', albumId)
  return photos.sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
}

async function findDuplicateByPhash(phash: string): Promise<Photo | null> {
  const db = await getDB()
  const existing = await db.getAllFromIndex('photos', 'byPhash', phash)
  return existing[0] ?? null
}

async function deletePhoto(id: string): Promise<void> {
  const db = await getDB()
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
  revIfExists(id)
}

async function getPhotoBlob(id: string): Promise<Blob> {
  return readPhotoFile(id)
}

async function getPhotoURL(id: string): Promise<string> {
  const cached = activeBlobUrls.get(id)
  if (cached) return cached
  const blob = await readPhotoFile(id)
  const url = URL.createObjectURL(blob)
  activeBlobUrls.set(id, url)
  return url
}

async function revokePhotoURL(id: string): Promise<void> {
  revIfExists(id)
}

async function addAlbum(name: string, coverPhotoId: string | null = null): Promise<Album> {
  const db = await getDB()
  const album: Album = {
    id: uuidv4(),
    name,
    coverPhotoId,
    photoCount: 0,
    createdAt: new Date(),
  }
  await db.add('albums', album)
  return album
}

async function updateAlbum(id: string, changes: Partial<Album>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('albums', id)
  if (!existing) return
  await db.put('albums', { ...existing, ...changes })
}

async function deleteAlbum(id: string): Promise<void> {
  const db = await getDB()
  const photos = await db.getAllFromIndex('photos', 'byAlbum', id)
  for (const p of photos) {
    await updatePhoto(p.id, { albumId: null })
  }
  await db.delete('albums', id)
}

async function getAllAlbums(): Promise<Album[]> {
  const db = await getDB()
  return db.getAll('albums')
}

async function addTag(name: string, parentId: string | null = null, path?: string): Promise<Tag> {
  const db = await getDB()
  let computedPath = path
  if (!computedPath) {
    if (parentId) {
      const parent = await db.get('tags', parentId)
      computedPath = parent ? `${parent.path}/${name}` : name
    } else {
      computedPath = name
    }
  }
  const tag: Tag = { id: uuidv4(), name, parentId, path: computedPath }
  await db.add('tags', tag)
  return tag
}

async function updateTag(id: string, changes: Partial<Tag>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('tags', id)
  if (!existing) return
  const updated: Tag = { ...existing, ...changes }
  if (changes.name && !changes.path) {
    const parts = existing.path.split('/')
    parts[parts.length - 1] = changes.name
    updated.path = parts.join('/')
  }
  await db.put('tags', updated)
  if (changes.name || changes.path) {
    const children = await db.getAllFromIndex('tags', 'byParent', id)
    for (const child of children) {
      const newChildPath = `${updated.path}/${child.name}`
      await updateTag(child.id, { path: newChildPath })
    }
  }
}

async function deleteTag(id: string): Promise<void> {
  const db = await getDB()
  const tags = await db.getAll('tags')
  const toDelete = new Set<string>()
  const collect = (tid: string) => {
    toDelete.add(tid)
    for (const t of tags) {
      if (t.parentId === tid) collect(t.id)
    }
  }
  collect(id)

  const tx = db.transaction(['tags', 'photoTags'], 'readwrite')
  for (const tid of toDelete) {
    await tx.objectStore('tags').delete(tid)
    const ptList = await tx.objectStore('photoTags').index('byTag').getAll(tid)
    for (const pt of ptList) {
      await tx.objectStore('photoTags').delete([pt.photoId, pt.tagId])
    }
  }
  await tx.done
}

async function getAllTags(): Promise<Tag[]> {
  const db = await getDB()
  return db.getAll('tags')
}

async function addTagToPhoto(photoId: string, tagId: string): Promise<void> {
  const db = await getDB()
  try {
    await db.add('photoTags', { photoId, tagId })
  } catch {
    // 已存在
  }
}

async function removeTagFromPhoto(photoId: string, tagId: string): Promise<void> {
  const db = await getDB()
  await db.delete('photoTags', [photoId, tagId])
}

async function getPhotoTags(photoId: string): Promise<Tag[]> {
  const db = await getDB()
  const photoTags = await db.getAllFromIndex('photoTags', 'byPhoto', photoId)
  const tagIds = photoTags.map((pt) => pt.tagId)
  const tags: Tag[] = []
  for (const tid of tagIds) {
    const t = await db.get('tags', tid)
    if (t) tags.push(t)
  }
  return tags
}

async function getPhotosByTag(tagId: string): Promise<Photo[]> {
  const db = await getDB()
  const photoTags = await db.getAllFromIndex('photoTags', 'byTag', tagId)
  const photos: Photo[] = []
  for (const pt of photoTags) {
    const p = await db.get('photos', pt.photoId)
    if (p) photos.push(p)
  }
  return photos.sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
}

async function addPerson(
  name: string,
  thumbnail: string,
  representativePhotoId: string | null = null,
): Promise<Person> {
  const db = await getDB()
  const person: Person = {
    id: uuidv4(),
    name,
    note: '',
    representativePhotoId,
    thumbnail,
    unnamedIndex: name.startsWith('未命名') ? Number(name.replace('未命名 ', '')) : null,
  }
  await db.add('people', person)
  return person
}

async function updatePerson(id: string, changes: Partial<Person>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('people', id)
  if (!existing) return
  const updated: Person = { ...existing, ...changes }
  if (changes.name && !changes.name.startsWith('未命名')) {
    updated.unnamedIndex = null
  }
  await db.put('people', updated)
}

async function deletePerson(id: string): Promise<void> {
  const db = await getDB()
  const faces = await db.getAllFromIndex('faces', 'byPerson', id)
  for (const f of faces) {
    await db.put('faces', { ...f, personId: null })
  }
  await db.delete('people', id)
}

async function mergePersons(targetId: string, sourceIds: string[]): Promise<void> {
  const db = await getDB()
  for (const sid of sourceIds) {
    const faces = await db.getAllFromIndex('faces', 'byPerson', sid)
    for (const f of faces) {
      await db.put('faces', { ...f, personId: targetId })
    }
    await db.delete('people', sid)
  }
}

async function getAllPeople(): Promise<Person[]> {
  const db = await getDB()
  return db.getAll('people')
}

async function addFace(face: Omit<Face, 'id'>): Promise<Face> {
  const db = await getDB()
  const f: Face = { ...face, id: uuidv4() }
  await db.add('faces', f)
  return f
}

async function getFacesByPhoto(photoId: string): Promise<Face[]> {
  const db = await getDB()
  return db.getAllFromIndex('faces', 'byPhoto', photoId)
}

async function getFacesByPerson(personId: string): Promise<Face[]> {
  const db = await getDB()
  return db.getAllFromIndex('faces', 'byPerson', personId)
}

async function getAllFaces(): Promise<Face[]> {
  const db = await getDB()
  return db.getAll('faces')
}

async function updateFacePerson(faceId: string, personId: string | null): Promise<void> {
  const db = await getDB()
  const face = await db.get('faces', faceId)
  if (!face) return
  await db.put('faces', { ...face, personId })
}

async function getNextUnnamedIndex(): Promise<number> {
  const people = await getAllPeople()
  const maxIdx = people.reduce((m, p) => (p.unnamedIndex != null ? Math.max(m, p.unnamedIndex) : m), 0)
  return maxIdx + 1
}

export const db = {
  addPhoto,
  updatePhoto,
  getPhoto,
  getAllPhotos,
  getPhotosByAlbum,
  findDuplicateByPhash,
  deletePhoto,
  getPhotoBlob,
  getPhotoURL,
  revokePhotoURL,
  addAlbum,
  updateAlbum,
  deleteAlbum,
  getAllAlbums,
  addTag,
  updateTag,
  deleteTag,
  getAllTags,
  addTagToPhoto,
  removeTagFromPhoto,
  getPhotoTags,
  getPhotosByTag,
  addPerson,
  updatePerson,
  deletePerson,
  mergePersons,
  getAllPeople,
  addFace,
  getFacesByPhoto,
  getFacesByPerson,
  getAllFaces,
  updateFacePerson,
  getNextUnnamedIndex,
}

export type DB = typeof db

export const useDB = () => db
