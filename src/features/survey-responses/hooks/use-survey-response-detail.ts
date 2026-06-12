import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveyResponsesApi } from '../api/survey-responses-api'

export function useSurveyResponseDetail(
  ekiciId: string,
  sablonId: number,
  enabled: boolean,
  baslikId?: number,
) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.detail(ekiciId, sablonId, baslikId),
    queryFn: () => surveyResponsesApi.getDetail(ekiciId, sablonId, baslikId),
    enabled: enabled && Boolean(ekiciId) && sablonId > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1000,
  })
}
