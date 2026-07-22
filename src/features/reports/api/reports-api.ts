import { apiClient } from '@/lib/api/api-client'
import type { AnketCevaplariQueryParams } from '../types/anket-cevaplari.types'
import type { YasCinsiyetQueryParams } from '../types/yas-cinsiyet-report.types'

type ReportFilterParams = YasCinsiyetQueryParams | AnketCevaplariQueryParams

function toQueryRecord(params: ReportFilterParams): Record<string, unknown> {
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
  getYasCinsiyet: (endpoint: string, params: YasCinsiyetQueryParams = {}) =>
    apiClient.get<unknown>(endpoint, toQueryRecord(params)),

  getAnketCevaplari: (params: AnketCevaplariQueryParams = {}) =>
    apiClient.get<unknown>('/api/Rapor/anket-cevaplari', toQueryRecord(params)),
}
