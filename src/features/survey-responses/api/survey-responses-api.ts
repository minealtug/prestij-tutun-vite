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
import { mapCografiFiltreOptionsFromApi } from '../utils/cografi-filtre'

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

async function fetchAnketCevapListFromApi(
  params: SurveyResponsesQueryParams,
): Promise<AnketCevapOzetItem[]> {
  if (!hasGeoSurveyFilter(params) && hasAnketSurveyFilter(params)) {
    const menseiler = await apiClient.get<FilterOptionDto[]>('/api/Mensei')
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

  getDetail: (ekiciId: string, sablonId: number) =>
    withDevFallback(
      async (): Promise<AnketCevapDetayDto> => {
        const raw = await apiClient.get<unknown>(
          `/api/AnketCevap/ekici/${encodeURIComponent(ekiciId)}/sablon/${sablonId}`,
        )
        return mapAnketCevapDetayFromApi(raw)
      },
      () => devResponsesStore.getDetail(ekiciId, sablonId),
    ),
}
