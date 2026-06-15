import { create } from 'zustand'
import type { Photo, Album, Person, Tag, ViewMode } from '@/types'

interface PhotoState {
  photos: Photo[]
  albums: Album[]
  people: Person[]
  tags: Tag[]
  selectedPhotoIds: Set<string>
  viewMode: ViewMode
  searchQuery: string
  activeTagId: string | null
  activeAlbumId: string | null
  activePersonId: string | null
  setPhotos: (photos: Photo[]) => void
  setAlbums: (albums: Album[]) => void
  setPeople: (people: Person[]) => void
  setTags: (tags: Tag[]) => void
  toggleSelectPhoto: (id: string) => void
  clearSelection: () => void
  selectAll: (ids: string[]) => void
  setViewMode: (mode: ViewMode) => void
  setSearchQuery: (q: string) => void
  setActiveTagId: (id: string | null) => void
  setActiveAlbumId: (id: string | null) => void
  setActivePersonId: (id: string | null) => void
  addPhoto: (p: Photo) => void
  removePhoto: (id: string) => void
  updateAlbumCount: (albumId: string, delta: number) => void
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: [],
  albums: [],
  people: [],
  tags: [],
  selectedPhotoIds: new Set(),
  viewMode: 'grid',
  searchQuery: '',
  activeTagId: null,
  activeAlbumId: null,
  activePersonId: null,

  setPhotos: (photos) => set({ photos }),
  setAlbums: (albums) => set({ albums }),
  setPeople: (people) => set({ people }),
  setTags: (tags) => set({ tags }),

  toggleSelectPhoto: (id) => {
    const next = new Set(get().selectedPhotoIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    set({ selectedPhotoIds: next })
  },
  clearSelection: () => set({ selectedPhotoIds: new Set() }),
  selectAll: (ids) => set({ selectedPhotoIds: new Set(ids) }),

  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveTagId: (activeTagId) => set({ activeTagId }),
  setActiveAlbumId: (activeAlbumId) => set({ activeAlbumId }),
  setActivePersonId: (activePersonId) => set({ activePersonId }),

  addPhoto: (p) => {
    const photos = [p, ...get().photos]
    set({ photos })
    if (p.albumId) {
      get().updateAlbumCount(p.albumId, 1)
    }
  },
  removePhoto: (id) => {
    const photo = get().photos.find((p) => p.id === id)
    const photos = get().photos.filter((p) => p.id !== id)
    set({ photos })
    if (photo?.albumId) {
      get().updateAlbumCount(photo.albumId, -1)
    }
  },
  updateAlbumCount: (albumId, delta) => {
    const albums = get().albums.map((a) =>
      a.id === albumId ? { ...a, photoCount: Math.max(0, a.photoCount + delta) } : a,
    )
    set({ albums })
  },
}))
