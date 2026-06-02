import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveysApi } from '../api/surveys-api'
import type { CreateSurveyRequest } from '../types/survey.types'

export function useSurveys() {
  return useQuery({
    queryKey: queryKeys.surveys.all,
    queryFn: () => surveysApi.getAll(),
  })
}

export function useCreateSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSurveyRequest) => surveysApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all })
    },
  })
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => surveysApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all })
    },
  })
}
