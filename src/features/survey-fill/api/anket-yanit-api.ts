import { apiClient } from '@/lib/api/api-client'
import type {
  AnketSablonDto,
  AnketYanitCevapRequest,
  AnketYanitOturumDto,
  AnketYanitOturumParams,
} from '../types/anket-yanit.types'
import {
  mapAnketSablonlarFromApi,
  mapAnketYanitOturumFromApi,
} from '../utils/normalize-anket-yanit-api'

export const anketYanitApi = {
  getSablonlar: async (baslikId: number): Promise<AnketSablonDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/AnketYanit/sablonlar', { baslikId })
    return mapAnketSablonlarFromApi(raw)
  },

  getOturum: async (params: AnketYanitOturumParams): Promise<AnketYanitOturumDto> => {
    const query = {
      baslikId: params.baslikId,
      sablonId: params.sablonId,
      ekiciId: params.ekiciId,
    }

    const [raw, tamamlanabilirRaw] = await Promise.all([
      apiClient.get<unknown>('/api/AnketYanit/oturum', query),
      apiClient.get<unknown>('/api/AnketYanit/tamamlanabilir', query),
    ])

    return mapAnketYanitOturumFromApi(raw, tamamlanabilirRaw)
  },

  submitCevap: (payload: AnketYanitCevapRequest) =>
    apiClient.post<unknown>('/api/AnketYanit/cevap', payload),
}
