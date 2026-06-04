import { apiClient } from '@/lib/api/api-client'
import type { AppError } from '@/lib/api/api-error'
import { isDevAuthEnabled } from '@/features/auth/dev/dev-auth'
import { devSurveysStore } from '../dev/dev-surveys-store'
import type { CreateSurveyRequest, SurveyDto } from '../types/survey.types'
import {
  DUPLICATE_SURVEY_NAME_MESSAGE,
  isSurveyNameTaken,
} from '../utils/survey-name'

interface LegacySurveyDto {
  id: string | number
  adi?: string | null
  aciklama?: string | null
  kaynak?: string | null
}

function mapLegacySurvey(item: LegacySurveyDto): SurveyDto {
  return {
    id: String(item.id),
    name: item.adi?.trim() || '-',
    aciklama: item.aciklama ?? null,
    kaynak: item.kaynak ?? undefined,
  }
}

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

export const surveysApi = {
  getAll: () =>
    withDevFallback(
      async () => {
        const items = await apiClient.get<LegacySurveyDto[]>('/api/AnketBaslik')
        return items.map(mapLegacySurvey)
      },
      () => devSurveysStore.getAll(),
    ),

  create: (payload: CreateSurveyRequest) =>
    withDevFallback(
      async () => {
        const items = await apiClient.get<LegacySurveyDto[]>('/api/AnketBaslik')
        const existing = items.map(mapLegacySurvey)
        if (isSurveyNameTaken(payload.name, existing)) {
          throw new Error(DUPLICATE_SURVEY_NAME_MESSAGE)
        }

        const created = await apiClient.post<LegacySurveyDto>('/api/AnketBaslik', {
          adi: payload.name,
        })
        return mapLegacySurvey(created)
      },
      () => devSurveysStore.create(payload),
    ),

  delete: (id: string) =>
    withDevFallback(
      () => apiClient.delete<void>(`/api/AnketBaslik/${id}`),
      () => {
        devSurveysStore.delete(id)
      },
    ),
}
