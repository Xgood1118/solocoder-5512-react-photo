import { openDB, IDBPDatabase, DBSchema } from 'idb'
import type { Photo, Album, Person, Tag, PhotoTag, Face } from '@/types'

export interface PhotoManagerDBSchema extends DBSchema {
  photos: {
    key: string
    value: Photo
    indexes: {
      byAlbum: string
      byTakenAt: number
      byPhash: string
      byImportedAt: number
    }
  }
  albums: {
    key: string
    value: Album
  }
  people: {
    key: string
    value: Person
  }
  tags: {
    key: string
    value: Tag
    indexes: {
      byPath: string
      byParent: string
    }
  }
  photoTags: {
    key: [string, string]
    value: PhotoTag
    indexes: {
      byPhoto: string
      byTag: string
    }
  }
  faces: {
    key: string
    value: Face
    indexes: {
      byPhoto: string
      byPerson: string
    }
  }
}

const DB_NAME = 'photo-manager'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PhotoManagerDBSchema>> | null = null

export function getDB(): Promise<IDBPDatabase<PhotoManagerDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<PhotoManagerDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('photos')) {
          const photosStore = db.createObjectStore('photos', { keyPath: 'id' })
          photosStore.createIndex('byAlbum', 'albumId')
          photosStore.createIndex('byTakenAt', 'takenAt')
          photosStore.createIndex('byPhash', 'phash')
          photosStore.createIndex('byImportedAt', 'importedAt')
        }

        if (!db.objectStoreNames.contains('albums')) {
          db.createObjectStore('albums', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('people')) {
          db.createObjectStore('people', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('tags')) {
          const tagsStore = db.createObjectStore('tags', { keyPath: 'id' })
          tagsStore.createIndex('byPath', 'path', { unique: true })
          tagsStore.createIndex('byParent', 'parentId')
        }

        if (!db.objectStoreNames.contains('photoTags')) {
          const ptStore = db.createObjectStore('photoTags', { keyPath: ['photoId', 'tagId'] })
          ptStore.createIndex('byPhoto', 'photoId')
          ptStore.createIndex('byTag', 'tagId')
        }

        if (!db.objectStoreNames.contains('faces')) {
          const facesStore = db.createObjectStore('faces', { keyPath: 'id' })
          facesStore.createIndex('byPhoto', 'photoId')
          facesStore.createIndex('byPerson', 'personId')
        }
      },
    })
  }
  return dbPromise
}
