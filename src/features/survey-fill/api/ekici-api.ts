import { apiClient } from '@/lib/api/api-client'
import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import type { EkiciDto } from '../types/ekici.types'
import { mapEkicilerFromApi } from '../utils/normalize-ekici-api'

function toEkiciQuery(params?: CografiFiltreQueryParams): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (params?.menseiId != null) record.menseiId = params.menseiId
  if (params?.bolgeId != null) record.bolgeId = params.bolgeId
  if (params?.mintikaId != null) record.mintikaId = params.mintikaId
  if (params?.alimNoktasiId != null) record.alimNoktasiId = params.alimNoktasiId
  if (params?.koyId != null) record.koyId = params.koyId
  return record
}

export const ekiciApi = {
  getByCurrentUserMintika: async (params?: CografiFiltreQueryParams): Promise<EkiciDto[]> => {
    const raw = await apiClient.get<unknown[]>('/api/Ekici/mintikam', toEkiciQuery(params))
    return mapEkicilerFromApi(raw)
  },
}
