import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { geziApi } from '../api/gezi-api'

export function useWithoutTobaccoEkiciCount() {
  return useQuery({
    queryKey: queryKeys.dashboard.geziTutunuOlmayan,
    queryFn: () => geziApi.getWithoutTobaccoCount(),
  })
}

export function useWithTobaccoProducerCount() {
  return useQuery({
    queryKey: queryKeys.dashboard.geziTutunuOlan,
    queryFn: () => geziApi.getWithTobaccoProducerCount(),
  })
}
