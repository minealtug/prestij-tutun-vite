import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveyResponsesApi } from '../api/survey-responses-api'
import {
  hasAnySurveyFilter,
  type SurveyResponsesQueryParams,
} from '../types/survey-response.types'

export function useSurveyResponses(params?: SurveyResponsesQueryParams) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.all(params),
    queryFn: () => surveyResponsesApi.getList(params ?? {}),
    enabled: hasAnySurveyFilter(params),
  })
}

export function useAllSurveyResponses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.adminAll,
    queryFn: () => surveyResponsesApi.getAll(),
    enabled,
    staleTime: 60_000,
  })
}

export function useMySurveyResponses(kullaniciId?: string) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.mine(kullaniciId ?? ''),
    queryFn: () => surveyResponsesApi.getMyList(kullaniciId ?? ''),
    enabled: Boolean(kullaniciId),
  })
}
