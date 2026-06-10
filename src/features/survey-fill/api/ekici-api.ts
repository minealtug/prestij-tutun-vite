import { apiClient } from '@/lib/api/api-client'
import type { EkiciDto } from '../types/ekici.types'
import { mapEkicilerFromApi } from '../utils/normalize-ekici-api'

export const ekiciApi = {
  getAll: async (): Promise<EkiciDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/Ekici')
    return mapEkicilerFromApi(raw)
  },
}
