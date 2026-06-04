import { apiClient } from '@/lib/api/api-client'
import type { AppError } from '@/lib/api/api-error'
import { isDevAuthEnabled } from '@/features/auth/dev/dev-auth'
import { devResponsesStore } from '../dev/dev-responses-store'
import type {
  AlimNoktasiDto,
  BolgeDto,
  FilterOptionDto,
  KoyDto,
  MintikaDto,
  SurveyResponseGroup,
  SurveyResponsesQueryParams,
} from '../types/survey-response.types'
import { groupAnketCevaplari } from '../utils/map-anket-cevap'
import {
  mapAnketCevapFromApi,
  normalizeYanitlanmayanSorularDto,
} from '../utils/normalize-survey-response-api'
import { uniqueById } from '../utils/unique-filter-options'

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

async function fetchBolgelerFromApi(menseiId?: number): Promise<BolgeDto[]> {
  if (menseiId) {
    return apiClient.get<BolgeDto[]>(`/api/Mensei/${menseiId}/Bolge`)
  }
  const menseiler = await apiClient.get<FilterOptionDto[]>('/api/Mensei')
  const lists = await Promise.all(
    menseiler.map((m) => apiClient.get<BolgeDto[]>(`/api/Mensei/${m.id}/Bolge`)),
  )
  return uniqueById(lists.flat())
}

async function fetchMintikalarFromApi(bolgeId?: number): Promise<MintikaDto[]> {
  if (bolgeId) {
    return apiClient.get<MintikaDto[]>(`/api/Bolge/${bolgeId}/Mintika`)
  }
  const bolgeler = await fetchBolgelerFromApi()
  const lists = await Promise.all(
    bolgeler.map((b) => apiClient.get<MintikaDto[]>(`/api/Bolge/${b.id}/Mintika`)),
  )
  return uniqueById(lists.flat())
}

async function fetchAlimNoktalariFromApi(mintikaId?: number): Promise<AlimNoktasiDto[]> {
  if (mintikaId) {
    return apiClient.get<AlimNoktasiDto[]>(`/api/Mintika/${mintikaId}/AlimNoktasi`)
  }
  const mintikalar = await fetchMintikalarFromApi()
  const lists = await Promise.all(
    mintikalar.map((m) => apiClient.get<AlimNoktasiDto[]>(`/api/Mintika/${m.id}/AlimNoktasi`)),
  )
  return uniqueById(lists.flat())
}

async function fetchKoylerFromApi(alimNoktasiId?: number): Promise<KoyDto[]> {
  if (alimNoktasiId) {
    return apiClient.get<KoyDto[]>(`/api/AlimNoktasi/${alimNoktasiId}/Koy`)
  }
  const alimNoktalari = await fetchAlimNoktalariFromApi()
  const lists = await Promise.all(
    alimNoktalari.map((a) => apiClient.get<KoyDto[]>(`/api/AlimNoktasi/${a.id}/Koy`)),
  )
  return uniqueById(lists.flat())
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

  getBolgeler: (menseiId?: number) =>
    withDevFallback(
      () => fetchBolgelerFromApi(menseiId),
      () => devResponsesStore.getBolgeler(menseiId),
    ),

  getMintikalar: (bolgeId?: number) =>
    withDevFallback(
      () => fetchMintikalarFromApi(bolgeId),
      () => devResponsesStore.getMintikalar(bolgeId),
    ),

  getAlimNoktalari: (mintikaId?: number) =>
    withDevFallback(
      () => fetchAlimNoktalariFromApi(mintikaId),
      () => devResponsesStore.getAlimNoktalari(mintikaId),
    ),

  getKoyler: (alimNoktasiId?: number) =>
    withDevFallback(
      () => fetchKoylerFromApi(alimNoktasiId),
      () => devResponsesStore.getKoyler(alimNoktasiId),
    ),

  getFiltered: async (params: SurveyResponsesQueryParams): Promise<SurveyResponseGroup[]> => {
    const fetchGroups = async (): Promise<SurveyResponseGroup[]> => {
      const items = await apiClient.get<unknown[]>('/api/AnketCevap', toQueryRecord(params))
      return groupAnketCevaplari(items.map((item) => mapAnketCevapFromApi(item)))
    }

    return withDevFallback(fetchGroups, () => devResponsesStore.getFiltered(params))
  },

  getUnansweredQuestions: (ekiciId: string, baslikId: number) =>
    withDevFallback(
      async () => {
        const raw = await apiClient.get<unknown>(
          `/api/AnketCevap/ekici/${encodeURIComponent(ekiciId)}/baslik/${baslikId}/yanitlanmayan-sorular`,
        )
        return normalizeYanitlanmayanSorularDto(raw)
      },
      () => devResponsesStore.getUnansweredQuestions(ekiciId, baslikId),
    ),
}
