import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveyResponsesApi } from '../api/survey-responses-api'
import {
  type DeleteAnketCevapRequest,
  type SurveyResponsesQueryParams,
} from '../types/survey-response.types'
import {
  combineDeleteAnketCevapResults,
  filterDeletedSurveyResponsesByPayloads,
} from '../utils/delete-survey-responses'

export function useSurveyResponses(params?: SurveyResponsesQueryParams) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.all(params),
    queryFn: () => surveyResponsesApi.getList(params ?? {}),
    enabled: params != null,
    staleTime: 0,
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

export function useDeleteSurveyResponses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payloads: DeleteAnketCevapRequest[]) => {
      const results = []
      for (const payload of payloads) {
        results.push(await surveyResponsesApi.deleteCevaplar(payload))
      }
      return combineDeleteAnketCevapResults(results)
    },
    onSuccess: (_result, payloads) => {
      queryClient.setQueriesData({ queryKey: ['survey-responses'] }, (old) => {
        if (!Array.isArray(old)) return old
        return filterDeletedSurveyResponsesByPayloads(old, payloads)
      })

      void queryClient.invalidateQueries({
        queryKey: ['survey-responses'],
        refetchType: 'none',
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary })
      void queryClient.invalidateQueries({ queryKey: queryKeys.ekiciDefinitions.all })
    },
  })
}
