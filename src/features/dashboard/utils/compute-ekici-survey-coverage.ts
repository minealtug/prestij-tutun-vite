import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
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

export type EkiciFillStatus = 'completed' | 'partial' | 'untouched'

/** Her ekici tek kova: yarım kayıt varsa yarım, hepsi tamamsa tamamlanan, kayıt yoksa giriş yok. */
export function classifyEkiciFillStatus(rows: AnketCevapOzetItem[]): EkiciFillStatus {
  if (rows.length === 0) return 'untouched'

  let hasCompleted = false
  let hasUnfinished = false
  for (const row of rows) {
    if (getSurveyResponseStatus(row) === 'completed') hasCompleted = true
    else hasUnfinished = true
  }

  if (hasUnfinished) return 'partial'
  if (hasCompleted) return 'completed'
  return 'untouched'
}

function groupSurveysByEkici(surveys: AnketCevapOzetItem[]): Map<string, AnketCevapOzetItem[]> {
  const surveysByEkici = new Map<string, AnketCevapOzetItem[]>()
  for (const survey of surveys) {
    const ekiciId = survey.ekiciId?.trim()
    if (!ekiciId) continue
    const key = normalizeEkiciId(ekiciId)
    const bucket = surveysByEkici.get(key) ?? []
    bucket.push(survey)
    surveysByEkici.set(key, bucket)
  }
  return surveysByEkici
}

export function computeEkiciSurveyCoverage(
  ekiciIds: string[],
  surveys: AnketCevapOzetItem[],
): EkiciSurveyCoverageStats {
  const normalizedEkiciIds = [
    ...new Set(ekiciIds.map(normalizeEkiciId).filter(Boolean)),
  ]
  const totalEkiciCount = normalizedEkiciIds.length
  const surveysByEkici = groupSurveysByEkici(surveys)

  let completedEkiciCount = 0
  let partialEkiciCount = 0
  let untouchedEkiciCount = 0

  for (const ekiciId of normalizedEkiciIds) {
    const status = classifyEkiciFillStatus(surveysByEkici.get(ekiciId) ?? [])
    if (status === 'completed') completedEkiciCount += 1
    else if (status === 'partial') partialEkiciCount += 1
    else untouchedEkiciCount += 1
  }

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

export interface MintikaEkiciFillRow {
  key: string
  label: string
  totalEkici: number
  completedEkici: number
  partialEkici: number
  untouchedEkici: number
}

function mintikaLabel(value: string | null | undefined): string {
  const text = value?.trim()
  return text && text.length > 0 ? text : 'Belirtilmemiş'
}

export function computeMintikaEkiciFillRows(
  ekiciler: EkiciDefinitionDto[],
  surveys: AnketCevapOzetItem[],
): MintikaEkiciFillRow[] {
  const buckets = new Map<string, MintikaEkiciFillRow>()

  const getBucket = (label: string): MintikaEkiciFillRow => {
    const key = label.toLocaleLowerCase('tr-TR')
    const current = buckets.get(key)
    if (current) return current
    const created: MintikaEkiciFillRow = {
      key,
      label,
      totalEkici: 0,
      completedEkici: 0,
      partialEkici: 0,
      untouchedEkici: 0,
    }
    buckets.set(key, created)
    return created
  }

  const surveysByEkici = groupSurveysByEkici(surveys)

  for (const ekici of ekiciler) {
    const bucket = getBucket(mintikaLabel(ekici.mintikaAdi))
    bucket.totalEkici += 1
    const status = classifyEkiciFillStatus(surveysByEkici.get(normalizeEkiciId(ekici.id)) ?? [])
    if (status === 'completed') bucket.completedEkici += 1
    else if (status === 'partial') bucket.partialEkici += 1
    else bucket.untouchedEkici += 1
  }

  return [...buckets.values()].sort((a, b) => a.label.localeCompare(b.label, 'tr-TR'))
}
