import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { reportsApi } from '../api/reports-api'
import type { EkiciYasCinsiyetQueryParams } from '../types/ekici-yas-cinsiyet.types'
import { normalizeEkiciYasCinsiyetReport } from '../utils/normalize-ekici-yas-cinsiyet'

export function useEkiciYasCinsiyetReport(
  params: EkiciYasCinsiyetQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.reports.ekiciYasCinsiyet(params),
    queryFn: () => reportsApi.getEkiciYasCinsiyet(params),
    select: normalizeEkiciYasCinsiyetReport,
    enabled: options?.enabled ?? true,
  })
}
