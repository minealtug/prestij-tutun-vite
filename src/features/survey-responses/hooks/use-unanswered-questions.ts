import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveyResponsesApi } from '../api/survey-responses-api'

export function useUnansweredQuestions(ekiciId: string, baslikId: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.unanswered(ekiciId, baslikId),
    queryFn: () => surveyResponsesApi.getUnansweredQuestions(ekiciId, baslikId),
    enabled: enabled && Boolean(ekiciId) && baslikId > 0,
  })
}
