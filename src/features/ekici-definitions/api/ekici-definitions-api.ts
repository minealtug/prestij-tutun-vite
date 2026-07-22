import { apiClient } from '@/lib/api/api-client'
import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import type {
  CreateEkiciDefinitionRequest,
  EkiciDefinitionDto,
  UpdateEkiciDefinitionRequest,
} from '../types/ekici-definition.types'
import {
  mapEkiciDefinitionFromApi,
  mapEkiciDefinitionsFromApi,
  toEkiciDefinitionPayload,
} from '../utils/normalize-ekici-definition-api'

function toEkiciQuery(params?: CografiFiltreQueryParams): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (params?.menseiId != null) record.menseiId = params.menseiId
  if (params?.bolgeId != null) record.bolgeId = params.bolgeId
  if (params?.mintikaId != null) record.mintikaId = params.mintikaId
  if (params?.alimNoktasiId != null) record.alimNoktasiId = params.alimNoktasiId
  if (params?.koyId != null) record.koyId = params.koyId
  return record
}

export const ekiciDefinitionsApi = {
  getAll: async (): Promise<EkiciDefinitionDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/Ekici')
    return mapEkiciDefinitionsFromApi(raw)
  },

  getDurumlar: async (): Promise<{ id: number; adi: string }[]> => {
    const raw = await apiClient.get<unknown[]>('/api/Ekici/durumlar')
    if (!Array.isArray(raw)) return []
    return raw
      .map((item) => {
        const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
        const id = Number(row.id ?? row.Id)
        const adi = String(row.adi ?? row.Adi ?? '').trim()
        if (!Number.isFinite(id) || id <= 0 || !adi) return null
        return { id, adi }
      })
      .filter((item): item is { id: number; adi: string } => item !== null)
  },

  getByCurrentUserMintika: async (
    params?: CografiFiltreQueryParams,
  ): Promise<EkiciDefinitionDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/Ekici/mintikam', toEkiciQuery(params))
    return mapEkiciDefinitionsFromApi(raw)
  },

  getById: async (id: string): Promise<EkiciDefinitionDto> => {
    const raw = await apiClient.get<unknown>(`/api/Ekici/${id}`)
    const mapped = mapEkiciDefinitionFromApi(raw)
    if (!mapped) throw new Error('Ekici kaydı okunamadı.')
    return mapped
  },

  create: async (payload: CreateEkiciDefinitionRequest): Promise<EkiciDefinitionDto> => {
    const raw = await apiClient.post<unknown>('/api/Ekici', toEkiciDefinitionPayload(payload))
    const mapped = mapEkiciDefinitionFromApi(raw)
    if (!mapped) throw new Error('Ekici kaydı oluşturulamadı.')
    return mapped
  },

  update: async (
    id: string,
    payload: UpdateEkiciDefinitionRequest,
  ): Promise<EkiciDefinitionDto> => {
    const raw = await apiClient.put<unknown>(`/api/Ekici/${id}`, toEkiciDefinitionPayload(payload))
    const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
    const ekiciRaw = row.ekici ?? row.Ekici ?? raw
    const mapped = mapEkiciDefinitionFromApi(ekiciRaw)
    if (!mapped) throw new Error('Ekici kaydı güncellenemedi.')
    return mapped
  },
}
