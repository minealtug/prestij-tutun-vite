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

export interface MintikaEkiciFillRow {
  key: string
  label: string
  totalEkici: number
  completedSurveys: number
  partialSurveys: number
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
      completedSurveys: 0,
      partialSurveys: 0,
      untouchedEkici: 0,
    }
    buckets.set(key, created)
    return created
  }

  const ekiciById = new Map<string, EkiciDefinitionDto>()
  for (const ekici of ekiciler) {
    ekiciById.set(normalizeEkiciId(ekici.id), ekici)
  }

  const surveysByEkici = new Map<string, AnketCevapOzetItem[]>()
  for (const survey of surveys) {
    const ekiciId = survey.ekiciId?.trim()
    if (!ekiciId) continue
    const key = normalizeEkiciId(ekiciId)
    const bucket = surveysByEkici.get(key) ?? []
    bucket.push(survey)
    surveysByEkici.set(key, bucket)
  }

  for (const ekici of ekiciler) {
    const bucket = getBucket(mintikaLabel(ekici.mintikaAdi))
    bucket.totalEkici += 1
    const rows = surveysByEkici.get(normalizeEkiciId(ekici.id)) ?? []
    if (rows.length === 0) bucket.untouchedEkici += 1
  }

  for (const survey of surveys) {
    const ekici = ekiciById.get(normalizeEkiciId(survey.ekiciId ?? ''))
    const bucket = getBucket(mintikaLabel(ekici?.mintikaAdi || survey.mintikaAdi))
    const status = getSurveyResponseStatus(survey)
    if (status === 'completed') bucket.completedSurveys += 1
    else if (status === 'partial') bucket.partialSurveys += 1
  }

  return [...buckets.values()].sort((a, b) => a.label.localeCompare(b.label, 'tr-TR'))
}
