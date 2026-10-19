import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { anketYanitApi } from '../api/anket-yanit-api'
import type { AnketYanitCevapRequest, AnketYanitOturumParams } from '../types/anket-yanit.types'
import { buildAnketYanitCevapBatchRequest } from '../utils/build-anket-yanit-cevap-batch'

export function useAnketSablonlar(baslikId: number | null) {
  return useQuery({
    queryKey: queryKeys.surveyFill.sablonlar(baslikId ?? 0),
    queryFn: () => anketYanitApi.getSablonlar(baslikId!),
    enabled: baslikId != null && baslikId > 0,
  })
}

export function useAnketYanitOturum(params: AnketYanitOturumParams | null) {
  return useQuery({
    queryKey: params
      ? queryKeys.surveyFill.oturum(params)
      : ['survey-fill', 'oturum', 'idle'],
    queryFn: () => anketYanitApi.getOturum(params!),
    enabled:
      params != null &&
      params.baslikId > 0 &&
      params.sablonId > 0 &&
      params.ekiciId.trim().length > 0,
  })
}

export function useSubmitAnketYanitCevap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AnketYanitCevapRequest) => anketYanitApi.submitCevap(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'survey-fill' && query.queryKey[1] === 'oturum',
      })
      void queryClient.invalidateQueries({ queryKey: ['survey-responses'] })
    },
  })
}

function invalidateAfterCevapSave(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'survey-fill' && query.queryKey[1] === 'oturum',
  })
  void queryClient.invalidateQueries({ queryKey: ['survey-responses'] })
}

export function useSubmitAnketYanitCevapBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payloads: AnketYanitCevapRequest[]) => {
      const batchRequest = buildAnketYanitCevapBatchRequest(payloads)
      return anketYanitApi.submitCevapBatch(batchRequest)
    },
    onSuccess: () => invalidateAfterCevapSave(queryClient),
  })
}

export function useSubmitOwnAnketYanitCevaplar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payloads: AnketYanitCevapRequest[]) => {
      const batchRequest = buildAnketYanitCevapBatchRequest(payloads)
      return anketYanitApi.submitOwnCevap(batchRequest)
    },
    onSuccess: () => invalidateAfterCevapSave(queryClient),
  })
}
