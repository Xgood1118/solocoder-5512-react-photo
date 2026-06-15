export interface Photo {
  id: string
  fileName: string
  fileSize: number
  takenAt: Date
  importedAt: Date
  albumId: string | null
  thumbnail: string
  phash: string
  width: number
  height: number
  exifData: string
  faceGroupIds: string[]
}

export interface Album {
  id: string
  name: string
  coverPhotoId: string | null
  photoCount: number
  createdAt: Date
}

export interface Person {
  id: string
  name: string
  note: string
  representativePhotoId: string | null
  thumbnail: string
  unnamedIndex: number | null
}

export interface Tag {
  id: string
  name: string
  parentId: string | null
  path: string
}

export interface PhotoTag {
  photoId: string
  tagId: string
}

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Face {
  id: string
  photoId: string
  personId: string | null
  descriptor: number[]
  box: FaceBox
}

export type ViewMode = 'grid' | 'masonry' | 'timeline'

export type DuplicateAction = 'overwrite' | 'skip' | 'keep'

export interface ImportProgress {
  current: number
  total: number
  fileName: string
  step: 'decode' | 'exif' | 'thumbnail' | 'phash' | 'dedup' | 'save' | 'done'
}

export interface DuplicateCandidate {
  existingPhoto: Photo
  newFile: {
    name: string
    size: number
    lastModified: Date
    thumbnailPreview: string
  }
  hammingDistance: number
}

export interface BatchProgress {
  done: number
  total: number
  currentPhotoId: string
}

export type BatchOperationType = 'addTags' | 'moveToAlbum' | 'delete'

export interface BatchOperationPayload {
  type: BatchOperationType
  photoIds: string[]
  tagIds?: string[]
  albumId?: string | null
}
