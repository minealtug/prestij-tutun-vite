import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveyResponsesApi } from '@/features/survey-responses/api/survey-responses-api'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { listUnansweredQuestionTexts } from '../utils/list-unanswered-questions'

export interface StalePartialUnansweredInfo {
  loading: boolean
  questions: string[]
}

export function useStalePartialUnanswered(
  items: AnketCevapOzetItem[],
  enabled: boolean,
): Map<string, StalePartialUnansweredInfo> {
  const queries = useQueries({
    queries: items.map((item) => ({
      queryKey: queryKeys.surveyResponses.detail(item.ekiciId, item.sablonId, item.baslikId),
      queryFn: () => surveyResponsesApi.getDetail(item.ekiciId, item.sablonId, item.baslikId),
      enabled: enabled && Boolean(item.ekiciId) && item.sablonId > 0,
      staleTime: 5 * 60 * 1000,
    })),
  })

  return useMemo(() => {
    const map = new Map<string, StalePartialUnansweredInfo>()
    items.forEach((item, index) => {
      const query = queries[index]
      map.set(item.id, {
        loading: Boolean(query?.isLoading || query?.isPending),
        questions: query?.data ? listUnansweredQuestionTexts(query.data) : [],
      })
    })
    return map
  }, [items, queries])
}
