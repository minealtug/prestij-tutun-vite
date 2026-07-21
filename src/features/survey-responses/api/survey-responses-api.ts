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
import { anketYanitApi, isAnketCevapNotFoundError } from '@/features/survey-fill/api/anket-yanit-api'
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

function unwrapKullaniciCevapPage(raw: unknown): { items: unknown[]; totalPages: number } {
  if (Array.isArray(raw)) {
    return { items: raw, totalPages: 1 }
  }

  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const itemsRaw = row.items ?? row.Items
  const totalPagesRaw = Number(row.totalPages ?? row.TotalPages ?? 1)

  return {
    items: Array.isArray(itemsRaw) ? itemsRaw : [],
    totalPages: Number.isFinite(totalPagesRaw) && totalPagesRaw > 0 ? totalPagesRaw : 1,
  }
}

async function fetchKullaniciCevapOzetList(kullaniciId: string): Promise<AnketCevapOzetItem[]> {
  try {
    const pageSize = 50
    let page = 1
    const allItems: unknown[] = []

    while (true) {
      const raw = await apiClient.get<unknown>(
        `/api/AnketCevap/kullanici/${encodeURIComponent(kullaniciId)}`,
        { page, pageSize },
      )
      const { items, totalPages } = unwrapKullaniciCevapPage(raw)
      allItems.push(...items)
      if (page >= totalPages) break
      page += 1
    }

    return mapAndFilterAnketCevapItems(allItems, {})
  } catch (error) {
    if (isAnketCevapNotFoundError(error)) {
      return []
    }
    throw error
  }
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

async function fetchAllAnketCevapListFromApi(): Promise<AnketCevapOzetItem[]> {
  const menseiler = await fetchMenseilerForAnketOnlySearch()
  if (menseiler.length === 0) {
    const items = await apiClient.get<unknown[]>('/api/AnketCevap', {})
    return mapAndFilterAnketCevapItems(items, {})
  }

  const lists = await Promise.all(
    menseiler.map((mensei) =>
      apiClient.get<unknown[]>('/api/AnketCevap', toQueryRecord({ menseiId: mensei.id })),
    ),
  )
  const byId = new Map<string, AnketCevapOzetItem>()
  for (const item of mapAndFilterAnketCevapItems(lists.flat(), {})) {
    byId.set(item.id, item)
  }
  return sortAnketCevapOzetList([...byId.values()])
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

  /** Admin paneli: tüm menşeiler üzerinden birleşik özet listesi. */
  getAll: async (): Promise<AnketCevapOzetItem[]> =>
    withDevFallback(
      () => fetchAllAnketCevapListFromApi(),
      () => devResponsesStore.getList({}),
    ),

  getMyList: async (kullaniciId: string): Promise<AnketCevapOzetItem[]> =>
    withDevFallback(
      () => fetchKullaniciCevapOzetList(kullaniciId),
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
            baslikId != null && baslikId > 0 ? { baslikId } : undefined,
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
