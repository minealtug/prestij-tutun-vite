import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import { queryKeys } from '@/lib/query/query-keys'
import { ekiciDefinitionsApi } from '../api/ekici-definitions-api'
import type {
  CreateEkiciDefinitionRequest,
  UpdateEkiciDefinitionRequest,
} from '../types/ekici-definition.types'

export function useEkiciDefinitions() {
  return useQuery({
    queryKey: queryKeys.ekiciDefinitions.all,
    queryFn: () => ekiciDefinitionsApi.getAll(),
  })
}

export function useEkiciDurumOptions() {
  return useQuery({
    queryKey: queryKeys.ekiciDefinitions.durumlar,
    queryFn: () => ekiciDefinitionsApi.getDurumlar(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyEkiciler(
  params?: CografiFiltreQueryParams,
  options?: { requireMintika?: boolean },
) {
  const scoped = params !== undefined
  const requireMintika = options?.requireMintika ?? scoped
  const mintikaReady = Boolean(params?.mintikaId)

  return useQuery({
    queryKey: queryKeys.ekiciDefinitions.mintikam(params ?? {}),
    queryFn: () => ekiciDefinitionsApi.getByCurrentUserMintika(params),
    enabled: !scoped || !requireMintika || mintikaReady,
  })
}

export function useCreateEkiciDefinition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateEkiciDefinitionRequest) => ekiciDefinitionsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ekiciDefinitions.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.surveyFill.ekicilerRoot })
    },
  })
}

export function useUpdateEkiciDefinition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateEkiciDefinitionRequest
    }) => ekiciDefinitionsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ekiciDefinitions.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.surveyFill.ekicilerRoot })
    },
  })
}
