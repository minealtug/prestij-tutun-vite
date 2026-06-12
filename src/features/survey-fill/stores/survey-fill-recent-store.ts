import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentSurveySave {
  id: string
  baslikId: number
  sablonId: number
  ekiciId: string
  baslikAdi: string
  sablonAdi: string
  ekiciAdi: string
  savedAt: number
  answeredCount: number
}

const MAX_RECENT_SAVES = 8

interface SurveyFillRecentState {
  items: RecentSurveySave[]
  addRecentSave: (entry: Omit<RecentSurveySave, 'id' | 'savedAt'> & { savedAt?: number }) => void
  clearRecentSaves: () => void
}

function buildRecentId(baslikId: number, sablonId: number, ekiciId: string) {
  return `${baslikId}-${sablonId}-${ekiciId}`
}

export const useSurveyFillRecentStore = create<SurveyFillRecentState>()(
  persist(
    (set) => ({
      items: [],
      addRecentSave: (entry) =>
        set((state) => {
          const id = buildRecentId(entry.baslikId, entry.sablonId, entry.ekiciId)
          const savedAt = entry.savedAt ?? Date.now()
          const nextItem: RecentSurveySave = { ...entry, id, savedAt }
          const withoutDuplicate = state.items.filter((item) => item.id !== id)
          return {
            items: [nextItem, ...withoutDuplicate].slice(0, MAX_RECENT_SAVES),
          }
        }),
      clearRecentSaves: () => set({ items: [] }),
    }),
    { name: 'prestij-survey-fill-recent' },
  ),
)
