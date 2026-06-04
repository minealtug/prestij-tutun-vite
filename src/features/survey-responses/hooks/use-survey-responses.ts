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
