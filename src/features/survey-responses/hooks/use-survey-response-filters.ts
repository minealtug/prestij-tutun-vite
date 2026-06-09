import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveyResponsesApi } from '../api/survey-responses-api'

const COGRAFI_FILTRE_STALE_MS = 30 * 60 * 1000

export function useCografiFiltreOptions() {
  return useQuery({
    queryKey: queryKeys.surveyResponses.cografiFiltreOptions,
    queryFn: () => surveyResponsesApi.getCografiFiltreOptions(),
    staleTime: COGRAFI_FILTRE_STALE_MS,
  })
}
