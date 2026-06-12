import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { queryKeys } from '@/lib/query/query-keys'
import { anketYanitApi } from '../api/anket-yanit-api'
import type { AltSecenekOptionDto } from '../types/anket-yanit.types'

export function useAltSeceneklerByGrupIds(secenekGrupIds: number[]) {
  const uniqueIds = useMemo(
    () => [...new Set(secenekGrupIds.filter((id) => Number.isFinite(id) && id > 0))],
    [secenekGrupIds],
  )

  const queries = useQueries({
    queries: uniqueIds.map((secenekGrupId) => ({
      queryKey: queryKeys.surveyFill.altSecenekler(secenekGrupId),
      queryFn: () => anketYanitApi.getAltSecenekler(secenekGrupId),
      staleTime: 30 * 60 * 1000,
    })),
  })

  const optionsByGrupId = useMemo(() => {
    const map: Record<number, AltSecenekOptionDto[]> = {}
    uniqueIds.forEach((secenekGrupId, index) => {
      map[secenekGrupId] = queries[index]?.data ?? []
    })
    return map
  }, [queries, uniqueIds])

  return {
    optionsByGrupId,
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
  }
}
