import { apiClient } from '@/lib/api/api-client'
import { parseCountNumber } from '../utils/count-gezi-ekiciler'

export const geziApi = {
  getWithoutTobaccoCount: async (): Promise<number> => {
    const raw = await apiClient.get<unknown>('/api/Gezi/tutunu-olmayan-uretici-sayisi')
    return parseCountNumber(raw)
  },

  getWithTobaccoProducerCount: async (): Promise<number> => {
    const raw = await apiClient.get<unknown>('/api/Gezi/tutunu-olan-uretici-sayisi')
    return parseCountNumber(raw)
  },
}
