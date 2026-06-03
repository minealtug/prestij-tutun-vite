import { apiClient } from '@/lib/api/api-client'
import type { AppError } from '@/lib/api/api-error'
import { isDevAuthEnabled } from '@/features/auth/dev/dev-auth'
import { devResponsesStore } from '../dev/dev-responses-store'
import type {
  AlimNoktasiDto,
  AnketCevapDto,
  BolgeDto,
  FilterOptionDto,
  KoyDto,
  MintikaDto,
  SurveyResponseGroup,
  SurveyResponsesQueryParams,
} from '../types/survey-response.types'
import { groupAnketCevaplari } from '../utils/map-anket-cevap'

function isNetworkError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isNetworkError' in error &&
    (error as AppError).isNetworkError === true
  )
}

async function withDevFallback<T>(apiCall: () => Promise<T>, devCall: () => T): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    if (isDevAuthEnabled() && isNetworkError(error)) {
      return devCall()
    }
    throw error
  }
}

function toQueryRecord(params: SurveyResponsesQueryParams): Record<string, unknown> {
  return {
    menseiId: params.menseiId,
    bolgeId: params.bolgeId,
    alimNoktasiId: params.alimNoktasiId,
    mintikaId: params.mintikaId,
    koyId: params.koyId,
  }
}

export const surveyResponsesApi = {
  getMenseiler: () =>
    withDevFallback(
      () => apiClient.get<FilterOptionDto[]>('/api/Mensei'),
      () => devResponsesStore.getMenseiler(),
    ),

  getBolgeler: (menseiId: number) =>
    withDevFallback(
      () => apiClient.get<BolgeDto[]>(`/api/Mensei/${menseiId}/Bolge`),
      () => devResponsesStore.getBolgeler(menseiId),
    ),

  getMintikalar: (bolgeId: number) =>
    withDevFallback(
      () => apiClient.get<MintikaDto[]>(`/api/Bolge/${bolgeId}/Mintika`),
      () => devResponsesStore.getMintikalar(bolgeId),
    ),

  getAlimNoktalari: (mintikaId: number) =>
    withDevFallback(
      () => apiClient.get<AlimNoktasiDto[]>(`/api/Mintika/${mintikaId}/AlimNoktasi`),
      () => devResponsesStore.getAlimNoktalari(mintikaId),
    ),

  getKoyler: (alimNoktasiId: number) =>
    withDevFallback(
      () => apiClient.get<KoyDto[]>(`/api/AlimNoktasi/${alimNoktasiId}/Koy`),
      () => devResponsesStore.getKoyler(alimNoktasiId),
    ),

  getFiltered: async (params: SurveyResponsesQueryParams): Promise<SurveyResponseGroup[]> => {
    const fetchGroups = async (): Promise<SurveyResponseGroup[]> => {
      const items = await apiClient.get<AnketCevapDto[]>(
        '/api/AnketCevap',
        toQueryRecord(params),
      )
      return groupAnketCevaplari(items)
    }

    return withDevFallback(fetchGroups, () => devResponsesStore.getFiltered(params))
  },
}
