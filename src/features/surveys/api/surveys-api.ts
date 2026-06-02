import { apiClient } from '@/lib/api/api-client'
import type { AppError } from '@/lib/api/api-error'
import { isDevAuthEnabled } from '@/features/auth/dev/dev-auth'
import { devSurveysStore } from '../dev/dev-surveys-store'
import type { CreateSurveyRequest, SurveyDto } from '../types/survey.types'

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
      () => apiClient.get<SurveyDto[]>('/surveys'),
      () => devSurveysStore.getAll(),
    ),

  create: (payload: CreateSurveyRequest) =>
    withDevFallback(
      () => apiClient.post<SurveyDto>('/surveys', payload),
      () => devSurveysStore.create(payload),
    ),

  delete: (id: string) =>
    withDevFallback(
      () => apiClient.delete<void>(`/surveys/${id}`),
      () => {
        devSurveysStore.delete(id)
      },
    ),
}
