import { useQuery } from '@tanstack/react-query'
import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import { queryKeys } from '@/lib/query/query-keys'
import { ekiciApi } from '../api/ekici-api'

export function useEkiciler(params?: CografiFiltreQueryParams, enabled = true) {
  const mintikaReady = Boolean(params?.mintikaId)

  return useQuery({
    queryKey: queryKeys.surveyFill.ekiciler(params ?? {}),
    queryFn: () => ekiciApi.getByCurrentUserMintika(params),
    enabled: enabled && mintikaReady,
    staleTime: 0,
  })
}
