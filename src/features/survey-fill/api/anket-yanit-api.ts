import { apiClient } from '@/lib/api/api-client'
import type {
  AltSecenekOptionDto,
  AnketSablonDto,
  AnketYanitCevapRequest,
  AnketYanitOturumDto,
  AnketYanitOturumParams,
} from '../types/anket-yanit.types'
import { mapAltSeceneklerFromApi } from '../utils/normalize-alt-secenek-api'
import {
  mapAnketSablonlarFromApi,
  mapAnketYanitOturumFromApi,
} from '../utils/normalize-anket-yanit-api'

async function tryFetchAltSecenekler(path: string): Promise<AltSecenekOptionDto[] | null> {
  try {
    const raw = await apiClient.get<unknown[]>(path)
    return mapAltSeceneklerFromApi(raw)
  } catch {
    return null
  }
}

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

  getAltSecenekler: async (secenekGrupId: number): Promise<AltSecenekOptionDto[]> => {
    const candidates = [
      `/api/AnketYanit/secenek-grup/${secenekGrupId}/alt-secenekler`,
      `/api/AnketSecenekGrup/${secenekGrupId}/altSecenekler`,
    ]

    for (const path of candidates) {
      const options = await tryFetchAltSecenekler(path)
      if (options && options.length > 0) return options
    }

    return []
  },
}
