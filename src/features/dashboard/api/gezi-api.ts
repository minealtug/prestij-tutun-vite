import { apiClient } from '@/lib/api/api-client'
import { countGeziEkiciler } from '../utils/count-gezi-ekiciler'

export const geziApi = {
  getWithoutTobaccoCount: async (): Promise<number> => {
    const raw = await apiClient.get<unknown>('/api/Gezi')
    return countGeziEkiciler(raw)
  },
}
