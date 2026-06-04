import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveyResponsesApi } from '../api/survey-responses-api'

export function useSurveyResponseDetail(
  ekiciId: string,
  sablonId: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.detail(ekiciId, sablonId),
    queryFn: () => surveyResponsesApi.getDetail(ekiciId, sablonId),
    enabled: enabled && Boolean(ekiciId) && sablonId > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1000,
  })
}
