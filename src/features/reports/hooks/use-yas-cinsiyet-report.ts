import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { reportsApi } from '../api/reports-api'
import type { YasCinsiyetTabConfig } from '../config/ham-veri-report'
import type { YasCinsiyetQueryParams } from '../types/yas-cinsiyet-report.types'
import { normalizeYasCinsiyetReport } from '../utils/normalize-yas-cinsiyet-report'

export function useYasCinsiyetReport(
  tab: YasCinsiyetTabConfig,
  params: YasCinsiyetQueryParams,
  options?: { enabled?: boolean },
) {
  const bandKeys = tab.bands.map((b) => b.key)
  return useQuery({
    queryKey: queryKeys.reports.yasCinsiyet(tab.endpoint ?? tab.key, params),
    queryFn: () => reportsApi.getYasCinsiyet(tab.endpoint as string, params),
    select: (raw: unknown) => normalizeYasCinsiyetReport(raw, bandKeys, tab.totalKey),
    enabled: (options?.enabled ?? true) && Boolean(tab.endpoint),
  })
}
