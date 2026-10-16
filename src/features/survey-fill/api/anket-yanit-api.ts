import { apiClient } from '@/lib/api/api-client'
import { isAppError, normalizeApiError } from '@/lib/api/api-error'
import type {
  AltSecenekOptionDto,
  AnketSablonDto,
  AnketYanitCevapBatchRequest,
  AnketYanitCevapBatchResponse,
  AnketYanitCevapRequest,
  AnketYanitOturumDto,
  AnketYanitOturumParams,
} from '../types/anket-yanit.types'
import { mapAltSeceneklerFromApi } from '../utils/normalize-alt-secenek-api'
import {
  mapAnketSablonlarFromApi,
  mapAnketYanitOturumFromApi,
} from '../utils/normalize-anket-yanit-api'

async function tryFetchAltSecenekler(
  path: string,
  params?: Record<string, unknown>,
): Promise<AltSecenekOptionDto[] | null> {
  try {
    const raw = await apiClient.get<unknown[]>(path, params)
    return mapAltSeceneklerFromApi(raw)
  } catch {
    return null
  }
}

export function isAnketCevapNotFoundError(error: unknown): boolean {
  const { status, message } = isAppError(error) ? error : normalizeApiError(error)
  if (status === 404) return true

  const normalized = message.toLocaleLowerCase('tr-TR')
  return (
    normalized.includes('anket cevap bulunamadi') ||
    normalized.includes('anket cevap bulunamadı') ||
    normalized.includes('icin anket cevap bulunamadi') ||
    normalized.includes('için anket cevap bulunamadı') ||
    normalized.includes('status code 404')
  )
}

function createEmptyAnketCevapOturum(ekiciId: string): AnketYanitOturumDto {
  return {
    ekiciId,
    mintikaId: null,
    tamamlanabilir: false,
    sorular: [],
    yanitlananSoruSayisi: 0,
    yanitlanmayanSoruSayisi: 0,
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

  getAnketCevapOturum: async (
    ekiciId: string,
    sablonId: number,
  ): Promise<AnketYanitOturumDto> => {
    try {
      const raw = await apiClient.get<unknown>(
        `/api/AnketCevap/ekici/${encodeURIComponent(ekiciId)}/sablon/${sablonId}`,
      )
      return mapAnketYanitOturumFromApi(raw)
    } catch (error) {
      if (isAnketCevapNotFoundError(error)) {
        return createEmptyAnketCevapOturum(ekiciId)
      }
      throw error
    }
  },

  submitCevap: (payload: AnketYanitCevapRequest) =>
    apiClient.post<unknown>('/api/AnketYanit/cevap', payload),

  submitCevapBatch: (payload: AnketYanitCevapBatchRequest) =>
    apiClient.post<AnketYanitCevapBatchResponse>('/api/AnketYanit/cevap/batch', payload),

  /** Cevapladığım Anketler’den kendi kaydını düzenleme. */
  submitOwnCevap: (payload: AnketYanitCevapRequest) =>
    apiClient.post<unknown>('/api/AnketYanit/cevap/kendi', payload),

  getAltSecenekler: async (secenekGrupId: number): Promise<AltSecenekOptionDto[]> => {
    const queryCandidates = [
      ['/api/AnketAltSecenek/by-secenek-grup', { secenekGrupId }],
      ['/api/AnketSoru/alt-secenekler', { secenekGrupId }],
    ] as const

    for (const [path, params] of queryCandidates) {
      const options = await tryFetchAltSecenekler(path, params)
      if (options) return options
    }

    const pathCandidates = [
      `/api/AnketYanit/secenek-grup/${secenekGrupId}/alt-secenekler`,
      `/api/AnketSecenekGrup/${secenekGrupId}/altSecenekler`,
    ]

    for (const path of pathCandidates) {
      const options = await tryFetchAltSecenekler(path)
      if (options) return options
    }

    return []
  },
}
