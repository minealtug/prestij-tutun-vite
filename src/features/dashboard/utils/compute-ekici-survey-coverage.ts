import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { getSurveyResponseStatus } from './user-dashboard-survey-groups'

export interface EkiciSurveyCoverageStats {
  totalEkiciCount: number
  completedEkiciCount: number
  partialEkiciCount: number
  untouchedEkiciCount: number
  completedPercent: number | null
  partialPercent: number | null
  untouchedPercent: number | null
}

function normalizeEkiciId(ekiciId: string): string {
  return ekiciId.trim().toLowerCase()
}

function toPercent(count: number, total: number): number | null {
  if (total <= 0) return null
  return Math.round((count / total) * 100)
}

export function computeEkiciSurveyCoverage(
  ekiciIds: string[],
  surveys: AnketCevapOzetItem[],
): EkiciSurveyCoverageStats {
  const normalizedEkiciIds = [
    ...new Set(ekiciIds.map(normalizeEkiciId).filter(Boolean)),
  ]
  const totalEkiciCount = normalizedEkiciIds.length

  const surveysByEkici = new Map<string, AnketCevapOzetItem[]>()
  for (const survey of surveys) {
    const ekiciId = survey.ekiciId?.trim()
    if (!ekiciId) continue
    const key = normalizeEkiciId(ekiciId)
    const bucket = surveysByEkici.get(key) ?? []
    bucket.push(survey)
    surveysByEkici.set(key, bucket)
  }

  const completedEkicis = new Set<string>()
  const partialEkicis = new Set<string>()

  for (const ekiciId of normalizedEkiciIds) {
    const rows = surveysByEkici.get(ekiciId) ?? []
    if (rows.length === 0) continue

    for (const row of rows) {
      const status = getSurveyResponseStatus(row)
      if (status === 'completed') completedEkicis.add(ekiciId)
      if (status === 'partial') partialEkicis.add(ekiciId)
    }
  }

  const activeEkicis = new Set([...completedEkicis, ...partialEkicis])
  const completedEkiciCount = completedEkicis.size
  const partialEkiciCount = partialEkicis.size
  const untouchedEkiciCount = Math.max(0, totalEkiciCount - activeEkicis.size)

  return {
    totalEkiciCount,
    completedEkiciCount,
    partialEkiciCount,
    untouchedEkiciCount,
    completedPercent: toPercent(completedEkiciCount, totalEkiciCount),
    partialPercent: toPercent(partialEkiciCount, totalEkiciCount),
    untouchedPercent: toPercent(untouchedEkiciCount, totalEkiciCount),
  }
}
