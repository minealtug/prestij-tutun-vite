import { apiClient } from '@/lib/api/api-client'
import type { EkiciYasCinsiyetQueryParams } from '../types/ekici-yas-cinsiyet.types'

function toQueryRecord(params: EkiciYasCinsiyetQueryParams): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (params.baslikId != null) record.baslikId = params.baslikId
  if (params.menseiId != null) record.menseiId = params.menseiId
  if (params.bolgeId != null) record.bolgeId = params.bolgeId
  if (params.mintikaId != null) record.mintikaId = params.mintikaId
  if (params.alimNoktasiId != null) record.alimNoktasiId = params.alimNoktasiId
  if (params.koyId != null) record.koyId = params.koyId
  return record
}

export const reportsApi = {
  getEkiciYasCinsiyet: (params: EkiciYasCinsiyetQueryParams = {}) =>
    apiClient.get<unknown>('/api/Rapor/ekici-yas-cinsiyet', toQueryRecord(params)),
}
