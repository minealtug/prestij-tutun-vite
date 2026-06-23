import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import {
  filterSurveysByChartStatus,
  getSurveyGroupLabel,
  type SurveyChartGroupBy,
  type SurveyChartStatus,
} from './enrich-survey-location'

export interface SurveyStatusBarItem {
  label: string
  count: number
  surveyIds: string[]
}

/** @deprecated Use SurveyStatusBarItem */
export type IncompleteSurveyBarItem = SurveyStatusBarItem

const DEFAULT_LIMIT = 10

export function filterIncompleteSurveys(items: AnketCevapOzetItem[]): AnketCevapOzetItem[] {
  return filterSurveysByChartStatus(items, 'incomplete')
}

export function computeSurveyStatusBars(
  items: AnketCevapOzetItem[],
  groupBy: SurveyChartGroupBy,
  status: SurveyChartStatus,
  limit = DEFAULT_LIMIT,
): SurveyStatusBarItem[] {
  const filtered = filterSurveysByChartStatus(items, status)
  const groups = new Map<string, string[]>()

  for (const item of filtered) {
    const label = getSurveyGroupLabel(item, groupBy)
    const existing = groups.get(label) ?? []
    existing.push(item.id)
    groups.set(label, existing)
  }

  const sorted = [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'tr-TR'),
  )

  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit)
  const bars: SurveyStatusBarItem[] = top.map(([label, surveyIds]) => ({
    label,
    count: surveyIds.length,
    surveyIds,
  }))

  if (rest.length > 0) {
    const otherIds = rest.flatMap(([, ids]) => ids)
    bars.push({
      label: 'Diğer',
      count: otherIds.length,
      surveyIds: otherIds,
    })
  }

  return bars
}

export function computeIncompleteSurveyBars(
  items: AnketCevapOzetItem[],
  groupBy: SurveyChartGroupBy,
  limit = DEFAULT_LIMIT,
): SurveyStatusBarItem[] {
  return computeSurveyStatusBars(items, groupBy, 'incomplete', limit)
}

export function filterSurveysByBarSelection(
  items: AnketCevapOzetItem[],
  groupBy: SurveyChartGroupBy,
  selectedLabel: string | null,
  status: SurveyChartStatus = 'incomplete',
): AnketCevapOzetItem[] {
  const filtered = filterSurveysByChartStatus(items, status)
  if (!selectedLabel) return filtered

  if (selectedLabel === 'Diğer') {
    const bars = computeSurveyStatusBars(items, groupBy, status)
    const otherBar = bars.find((bar) => bar.label === 'Diğer')
    if (!otherBar) return filtered
    const idSet = new Set(otherBar.surveyIds)
    return filtered.filter((item) => idSet.has(item.id))
  }

  return filtered.filter((item) => getSurveyGroupLabel(item, groupBy) === selectedLabel)
}
