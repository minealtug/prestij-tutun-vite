import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { ekiciApi } from '../api/ekici-api'

export function useEkiciler(enabled = true) {
  return useQuery({
    queryKey: queryKeys.surveyFill.ekiciler,
    queryFn: () => ekiciApi.getAll(),
    enabled,
  })
}
