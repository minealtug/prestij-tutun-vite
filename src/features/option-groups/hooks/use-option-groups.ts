import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { optionGroupsApi } from '../api/option-groups-api'
import type {
  CreateSecenekGrupRequest,
  UpdateSecenekGrupRequest,
} from '../types/option-group.types'

function invalidateOptionGroupQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.optionGroups.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.questions.altSecenekler })
}

export function useOptionGroups() {
  return useQuery({
    queryKey: queryKeys.optionGroups.all,
    queryFn: () => optionGroupsApi.getAll(),
  })
}

export function useCreateOptionGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSecenekGrupRequest) => optionGroupsApi.create(payload),
    onSuccess: () => invalidateOptionGroupQueries(queryClient),
  })
}

export function useUpdateOptionGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      secenekGrupId,
      payload,
    }: {
      secenekGrupId: number
      payload: UpdateSecenekGrupRequest
    }) => optionGroupsApi.update(secenekGrupId, payload),
    onSuccess: () => invalidateOptionGroupQueries(queryClient),
  })
}

export function useDeleteOptionGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (secenekGrupId: number) => optionGroupsApi.delete(secenekGrupId),
    onSuccess: () => invalidateOptionGroupQueries(queryClient),
  })
}
