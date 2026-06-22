import { useMemo } from 'react'
import { useEkiciDefinitions } from '@/features/ekici-definitions/hooks/use-ekici-definitions'
import { useCografiFiltreOptions } from '@/features/survey-responses/hooks/use-survey-response-filters'
import type { AgeGenderReportFilters } from '../types/age-gender-report.types'
import { aggregateAgeGenderReport } from '../utils/age-gender-aggregation'

export function useAgeGenderReport(filters: AgeGenderReportFilters) {
  const ekiciQuery = useEkiciDefinitions()
  const cografiQuery = useCografiFiltreOptions()

  const bolgeler = useMemo(() => {
    const set = new Set<string>()
    for (const ekici of ekiciQuery.data ?? []) {
      if (ekici.bolgeAdi?.trim()) set.add(ekici.bolgeAdi.trim())
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'tr-TR'))
  }, [ekiciQuery.data])

  const report = useMemo(() => {
    if (!ekiciQuery.data) return null
    return aggregateAgeGenderReport(ekiciQuery.data, filters)
  }, [ekiciQuery.data, filters])

  return {
    report,
    bolgeler,
    menseiler: cografiQuery.data?.menseiler ?? [],
    ekiciQuery,
    cografiQuery,
  }
}
