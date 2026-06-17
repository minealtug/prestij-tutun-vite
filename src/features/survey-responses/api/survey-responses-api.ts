import { apiClient } from '@/lib/api/api-client'
import type { AppError } from '@/lib/api/api-error'
import { isDevAuthEnabled } from '@/features/auth/dev/dev-auth'
import { devResponsesStore } from '../dev/dev-responses-store'
import type {
  AnketCevapDetayDto,
  AnketCevapOzetItem,
  CografiFiltreOptionsDto,
  FilterOptionDto,
  SurveyResponsesQueryParams,
} from '../types/survey-response.types'
import {
  hasAnketSurveyFilter,
  hasGeoSurveyFilter,
} from '../types/survey-response.types'
import { filterAnketCevapList } from '../utils/filter-anket-cevap-list'
import { sortAnketCevapOzetList } from '../utils/map-anket-cevap'
import {
  mapAnketCevapDetayFromApi,
  mapAnketCevapOzetFromApi,
} from '../utils/normalize-survey-response-api'
import { anketYanitApi } from '@/features/survey-fill/api/anket-yanit-api'
import { mapCografiFiltreOptionsFromApi } from '../utils/cografi-filtre'
import { mapOturumToCevapDetay } from '../utils/map-oturum-to-cevap-detay'

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
  const record: Record<string, unknown> = {}
  if (params.baslikId != null) record.baslikId = params.baslikId
  if (params.menseiId != null) record.menseiId = params.menseiId
  if (params.bolgeId != null) record.bolgeId = params.bolgeId
  if (params.mintikaId != null) record.mintikaId = params.mintikaId
  if (params.alimNoktasiId != null) record.alimNoktasiId = params.alimNoktasiId
  if (params.koyId != null) record.koyId = params.koyId
  return record
}

function mapAndFilterAnketCevapItems(
  items: unknown[],
  params: SurveyResponsesQueryParams,
): AnketCevapOzetItem[] {
  const ozet = items
    .map((item) => mapAnketCevapOzetFromApi(item))
    .filter((item): item is AnketCevapOzetItem => item !== null)
  return filterAnketCevapList(sortAnketCevapOzetList(ozet), params)
}

async function fetchMenseilerForAnketOnlySearch(): Promise<FilterOptionDto[]> {
  try {
    const raw = await apiClient.get<unknown>('/api/CografiFiltre/options')
    const menseiler = mapCografiFiltreOptionsFromApi(raw).menseiler
    if (menseiler.length > 0) return menseiler
  } catch {
    // CografiFiltre yoksa eski uç noktayı dene
  }

  const legacy = await apiClient.get<FilterOptionDto[]>('/api/Mensei')
  return legacy ?? []
}

async function fetchAnketCevapListFromApi(
  params: SurveyResponsesQueryParams,
): Promise<AnketCevapOzetItem[]> {
  if (!hasGeoSurveyFilter(params) && hasAnketSurveyFilter(params)) {
    const menseiler = await fetchMenseilerForAnketOnlySearch()
    if (menseiler.length === 0) {
      throw new Error(
        'Anket filtresi için menşei listesi alınamadı. Lütfen menşei veya başka bir coğrafi filtre seçin.',
      )
    }

    const lists = await Promise.all(
      menseiler.map((mensei) =>
        apiClient.get<unknown[]>(
          '/api/AnketCevap',
          toQueryRecord({ ...params, menseiId: mensei.id }),
        ),
      ),
    )
    const byId = new Map<string, AnketCevapOzetItem>()
    for (const item of mapAndFilterAnketCevapItems(lists.flat(), params)) {
      byId.set(item.id, item)
    }
    return sortAnketCevapOzetList([...byId.values()])
  }

  const items = await apiClient.get<unknown[]>('/api/AnketCevap', toQueryRecord(params))
  return mapAndFilterAnketCevapItems(items, params)
}

export const surveyResponsesApi = {
  getCografiFiltreOptions: () =>
    withDevFallback(
      async (): Promise<CografiFiltreOptionsDto> => {
        const raw = await apiClient.get<unknown>('/api/CografiFiltre/options')
        return mapCografiFiltreOptionsFromApi(raw)
      },
      () => devResponsesStore.getCografiFiltreOptions(),
    ),

  getList: async (params: SurveyResponsesQueryParams): Promise<AnketCevapOzetItem[]> =>
    withDevFallback(
      () => fetchAnketCevapListFromApi(params),
      () => devResponsesStore.getList(params),
    ),

  getMyList: async (kullaniciId: string): Promise<AnketCevapOzetItem[]> =>
    withDevFallback(
      async () => {
        const items = await apiClient.get<unknown[]>(
          `/api/AnketCevap/kullanici/${encodeURIComponent(kullaniciId)}`,
        )
        return mapAndFilterAnketCevapItems(items, {})
      },
      () => devResponsesStore.getList({}),
    ),

  getDetail: (ekiciId: string, sablonId: number, baslikId?: number) =>
    withDevFallback(
      async (): Promise<AnketCevapDetayDto> => {
        if (baslikId != null && baslikId > 0) {
          try {
            const oturum = await anketYanitApi.getOturum({ baslikId, sablonId, ekiciId })
            const fromOturum = mapOturumToCevapDetay(oturum)
            if (fromOturum.sorular.length > 0) return fromOturum
          } catch {
            // Oturum yoksa AnketCevap detayına düş
          }
        }

        try {
          const raw = await apiClient.get<unknown>(
            `/api/AnketCevap/ekici/${encodeURIComponent(ekiciId)}/sablon/${sablonId}`,
          )
          const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
          const responseBaslikId = Number(row.baslikId ?? row.BaslikId ?? NaN)
          const baslikMatches =
            baslikId == null ||
            !Number.isFinite(responseBaslikId) ||
            responseBaslikId <= 0 ||
            responseBaslikId === baslikId

          const detail = mapAnketCevapDetayFromApi(raw)
          if (detail.sorular.length > 0 && baslikMatches) return detail
        } catch {
          // AnketCevap detayı yok
        }

        return { sorular: [], yanitlanmayanSoruSayisi: 0 }
      },
      () => devResponsesStore.getDetail(ekiciId, sablonId),
    ),
}
