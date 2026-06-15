import { create } from 'zustand'
import type { Photo, ImportProgress, DuplicateCandidate, DuplicateAction } from '@/types'

interface UIState {
  viewerOpen: boolean
  viewerPhotoId: string | null
  viewerPhotoList: Photo[]
  viewerRotation: number
  importOpen: boolean
  importProgress: ImportProgress | null
  duplicateDialog: {
    open: boolean
    candidate: DuplicateCandidate | null
    onResolve: ((action: DuplicateAction) => void) | null
  } | null
  batchProgress: { done: number; total: number } | null
  sidebarCollapsed: boolean
  openViewer: (photoId: string, list: Photo[]) => void
  closeViewer: () => void
  setViewerRotation: (r: number) => void
  setImportOpen: (o: boolean) => void
  setImportProgress: (p: ImportProgress | null) => void
  showDuplicateDialog: (
    candidate: DuplicateCandidate,
    onResolve: (action: DuplicateAction) => void,
  ) => void
  hideDuplicateDialog: () => void
  setBatchProgress: (p: { done: number; total: number } | null) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  viewerOpen: false,
  viewerPhotoId: null,
  viewerPhotoList: [],
  viewerRotation: 0,
  importOpen: false,
  importProgress: null,
  duplicateDialog: null,
  batchProgress: null,
  sidebarCollapsed: false,

  openViewer: (viewerPhotoId, viewerPhotoList) =>
    set({ viewerOpen: true, viewerPhotoId, viewerPhotoList, viewerRotation: 0 }),
  closeViewer: () => set({ viewerOpen: false, viewerPhotoId: null, viewerPhotoList: [], viewerRotation: 0 }),
  setViewerRotation: (viewerRotation) => set({ viewerRotation }),

  setImportOpen: (importOpen) => set({ importOpen }),
  setImportProgress: (importProgress) => set({ importProgress }),

  showDuplicateDialog: (candidate, onResolve) =>
    set({ duplicateDialog: { open: true, candidate, onResolve } }),
  hideDuplicateDialog: () => set({ duplicateDialog: null }),

  setBatchProgress: (batchProgress) => set({ batchProgress }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
