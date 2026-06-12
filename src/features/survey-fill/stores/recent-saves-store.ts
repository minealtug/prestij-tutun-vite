import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SurveyFillRecentSave } from '../types/recent-save.types'
import { buildRecentSaveId } from '../types/recent-save.types'

const MAX_RECENT_SAVES = 8

interface RecentSavesState {
  items: SurveyFillRecentSave[]
  addRecentSave: (entry: Omit<SurveyFillRecentSave, 'id' | 'savedAt'> & { savedAt?: number }) => void
  clearRecentSaves: () => void
}

export const useSurveyFillRecentSavesStore = create<RecentSavesState>()(
  persist(
    (set) => ({
      items: [],
      addRecentSave: (entry) =>
        set((state) => {
          const id = buildRecentSaveId(entry.baslikId, entry.sablonId, entry.ekiciId)
          const savedAt = entry.savedAt ?? Date.now()
          const next: SurveyFillRecentSave = { ...entry, id, savedAt }
          const withoutDuplicate = state.items.filter((item) => item.id !== id)
          return {
            items: [next, ...withoutDuplicate].slice(0, MAX_RECENT_SAVES),
          }
        }),
      clearRecentSaves: () => set({ items: [] }),
    }),
    { name: 'prestij-survey-fill-recent' },
  ),
)
