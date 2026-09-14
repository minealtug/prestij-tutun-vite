import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { reportsApi } from '../api/reports-api'
import type { AnketCevaplariQueryParams } from '../types/anket-cevaplari.types'
import { normalizeAnketCevaplariReport } from '../utils/normalize-anket-cevaplari'

export function useAnketCevaplariReport(
  params: AnketCevaplariQueryParams,
  options?: { enabled?: boolean },
) {
  const baslikId = params.baslikId
  return useQuery({
    queryKey: queryKeys.reports.anketCevaplari({ baslikId }),
    queryFn: () => reportsApi.getAnketCevaplari({ baslikId }),
    select: normalizeAnketCevaplariReport,
    enabled: (options?.enabled ?? true) && Boolean(baslikId && baslikId > 0),
  })
}
