import { apiClient } from '@/lib/api/api-client'
import type { AltSecenekDto } from '../types/alt-secenek.types'
import {
  mapAltSecenekFromApi,
  mapAltSeceneklerFromApi,
} from '../utils/normalize-alt-secenek-api'

export interface CreateAltSecenekRequest {
  secenekGrupId: number
  adi: string
  siraNo: number
}

export interface UpdateAltSecenekRequest {
  secenekGrupId: number
  adi: string
  siraNo: number
}

export const anketAltSecenekApi = {
  getAll: async (): Promise<AltSecenekDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/AnketAltSecenek')
    return mapAltSeceneklerFromApi(raw)
  },

  getBySecenekGrupId: async (secenekGrupId: number): Promise<AltSecenekDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/AnketAltSecenek/by-secenek-grup', {
      secenekGrupId,
    })
    return mapAltSeceneklerFromApi(raw)
  },

  create: async (payload: CreateAltSecenekRequest): Promise<AltSecenekDto> => {
    const raw = await apiClient.post<unknown>('/api/AnketAltSecenek', payload)
    const mapped = mapAltSecenekFromApi(raw)
    if (mapped) return mapped
    const items = await anketAltSecenekApi.getBySecenekGrupId(payload.secenekGrupId)
    const found = items.find(
      (item) =>
        item.adi.toLocaleLowerCase('tr-TR') === payload.adi.trim().toLocaleLowerCase('tr-TR'),
    )
    if (found) return found
    throw new Error('Seçenek oluşturuldu ancak yanıt okunamadı.')
  },

  update: async (id: number, payload: UpdateAltSecenekRequest): Promise<AltSecenekDto> => {
    const raw = await apiClient.put<unknown>(`/api/AnketAltSecenek/${id}`, payload)
    const mapped = mapAltSecenekFromApi(raw)
    if (mapped) return mapped
    const items = await anketAltSecenekApi.getBySecenekGrupId(payload.secenekGrupId)
    const found = items.find((item) => item.id === id)
    if (!found) throw new Error('Güncellenen seçenek bulunamadı.')
    return found
  },

  delete: (id: number) => apiClient.delete<void>(`/api/AnketAltSecenek/${id}`),
}
