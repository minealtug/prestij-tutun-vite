import { apiClient } from '@/lib/api/api-client'
import type { AppError } from '@/lib/api/api-error'
import { isDevAuthEnabled } from '@/features/auth/dev/dev-auth'
import { devResponsesStore } from '../dev/dev-responses-store'
import type {
  SurveyResponseDto,
  SurveyResponsesQueryParams,
} from '../types/survey-response.types'

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

export const surveyResponsesApi = {
  getAll: (params?: SurveyResponsesQueryParams) =>
    withDevFallback(
      () =>
        apiClient.get<SurveyResponseDto[]>('/survey-responses', params as Record<string, unknown>),
      () => devResponsesStore.getAll(params),
    ),
}
