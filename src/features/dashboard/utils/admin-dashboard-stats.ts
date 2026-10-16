import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import {
  getOzetKullaniciAdi,
  getOzetSurveyName,
} from '@/features/survey-responses/types/survey-response.types'
import {
  getDaysSinceSonIslem,
  getSurveyResponseStatus,
  isStalePartialSurvey,
  sortPartialSurveysByPriority,
} from './user-dashboard-survey-groups'

export const ADMIN_ACTIVITY_DAY_OPTIONS = [7, 14, 30] as const
export type AdminActivityDayWindow = (typeof ADMIN_ACTIVITY_DAY_OPTIONS)[number]

export interface PeriodFormCounts {
  completed: number
  partial: number
}

export interface AdminFieldFillSummary {
  completed: number
  partial: number
  today: PeriodFormCounts
  week: PeriodFormCounts
}

export interface AdminEkiciActivitySummary {
  activeEkiciler: number
  passiveEkiciler: number
  totalEkiciler: number
  filledInWindow: number
  neverFilled: number
}

export interface AdminStalePartialRow {
  item: AnketCevapOzetItem
  kullaniciAdi: string
  anketAdi: string
  daysSince: number | null
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Pazartesi başlangıçlı yerel hafta. */
export function startOfLocalWeek(now = new Date()): number {
  const day = now.getDay()
  const mondayOffset = day === 0 ? 6 : day - 1
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset)
  return monday.getTime()
}

function parseSonIslemTime(iso: string): number | null {
  if (!iso?.trim()) return null
  const time = new Date(iso).getTime()
  return Number.isFinite(time) ? time : null
}

function isInPeriod(
  item: Pick<AnketCevapOzetItem, 'sonIslemTarihi'>,
  startMs: number,
  nowMs = Date.now(),
): boolean {
  const time = parseSonIslemTime(item.sonIslemTarihi)
  return time != null && time >= startMs && time <= nowMs
}

export function matchesEkiciCografiFiltre(
  ekici: Pick<
    EkiciDefinitionDto,
    'menseiId' | 'bolgeId' | 'mintikaId' | 'alimNoktasiId' | 'koyId'
  >,
  params: CografiFiltreQueryParams,
): boolean {
  if (params.menseiId != null && ekici.menseiId !== params.menseiId) return false
  if (params.bolgeId != null && ekici.bolgeId !== params.bolgeId) return false
  if (params.mintikaId != null && ekici.mintikaId !== params.mintikaId) return false
  if (params.alimNoktasiId != null && ekici.alimNoktasiId !== params.alimNoktasiId) {
    return false
  }
  if (params.koyId != null && ekici.koyId !== params.koyId) return false
  return true
}

export function filterEkicilerByCografi(
  ekiciler: EkiciDefinitionDto[],
  params: CografiFiltreQueryParams,
): EkiciDefinitionDto[] {
  const hasParams = Boolean(
    params.menseiId ||
      params.bolgeId ||
      params.mintikaId ||
      params.alimNoktasiId ||
      params.koyId,
  )
  if (!hasParams) return ekiciler
  return ekiciler.filter((ekici) => matchesEkiciCografiFiltre(ekici, params))
}

export function filterSurveysByCografi(
  items: AnketCevapOzetItem[],
  ekiciById: Map<string, EkiciDefinitionDto>,
  params: CografiFiltreQueryParams,
  mintikaIds: number[] | null,
): AnketCevapOzetItem[] {
  const hasParams = Boolean(
    params.menseiId ||
      params.bolgeId ||
      params.mintikaId ||
      params.alimNoktasiId ||
      params.koyId,
  )
  if (!hasParams) return items

  const mintikaIdSet = mintikaIds ? new Set(mintikaIds) : null

  return items.filter((item) => {
    const ekici = ekiciById.get(item.ekiciId)
    if (ekici) return matchesEkiciCografiFiltre(ekici, params)

    if (mintikaIdSet) {
      const mid = item.mintikaId
      return mid != null && mintikaIdSet.has(mid)
    }
    return true
  })
}

export function computeAdminFieldFillSummary(
  items: AnketCevapOzetItem[],
  now = new Date(),
): AdminFieldFillSummary {
  const todayStart = startOfLocalDay(now)
  const weekStart = startOfLocalWeek(now)
  const nowMs = now.getTime()

  let completed = 0
  let partial = 0
  const today: PeriodFormCounts = { completed: 0, partial: 0 }
  const week: PeriodFormCounts = { completed: 0, partial: 0 }

  for (const item of items) {
    const status = getSurveyResponseStatus(item)
    if (status === 'completed') {
      completed += 1
      if (isInPeriod(item, todayStart, nowMs)) today.completed += 1
      if (isInPeriod(item, weekStart, nowMs)) week.completed += 1
    } else if (status === 'partial') {
      partial += 1
      if (isInPeriod(item, todayStart, nowMs)) today.partial += 1
      if (isInPeriod(item, weekStart, nowMs)) week.partial += 1
    }
  }

  return { completed, partial, today, week }
}

function normalizeEkiciKey(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export function computeAdminEkiciActivity(
  ekiciler: EkiciDefinitionDto[],
  surveys: AnketCevapOzetItem[],
  dayWindow: AdminActivityDayWindow,
  now = new Date(),
): AdminEkiciActivitySummary {
  const windowStart = now.getTime() - dayWindow * 24 * 60 * 60 * 1000
  const knownIds = new Set(ekiciler.map((ekici) => ekici.id).filter(Boolean))
  const filledKeys = new Set<string>()
  const filledInWindowKeys = new Set<string>()

  for (const item of surveys) {
    const key = normalizeEkiciKey(item.ekiciId)
    if (!key || !knownIds.has(key)) continue
    filledKeys.add(key)
    if (isInPeriod(item, windowStart, now.getTime())) {
      filledInWindowKeys.add(key)
    }
  }

  let activeEkiciler = 0
  let passiveEkiciler = 0
  let neverFilled = 0

  for (const ekici of ekiciler) {
    if (ekici.aktif === 1) activeEkiciler += 1
    else passiveEkiciler += 1

    if (!filledKeys.has(ekici.id)) neverFilled += 1
  }

  return {
    activeEkiciler,
    passiveEkiciler,
    totalEkiciler: ekiciler.length,
    filledInWindow: filledInWindowKeys.size,
    neverFilled,
  }
}

export function countStalePartials(items: AnketCevapOzetItem[]): number {
  return items.filter(
    (item) => getSurveyResponseStatus(item) === 'partial' && isStalePartialSurvey(item),
  ).length
}

export function buildAdminStalePartialRows(
  items: AnketCevapOzetItem[],
  limit = 10,
): AdminStalePartialRow[] {
  const partial = sortPartialSurveysByPriority(
    items.filter((item) => getSurveyResponseStatus(item) === 'partial'),
  )
  const stale = partial.filter((item) => isStalePartialSurvey(item))

  return stale.slice(0, limit).map((item) => ({
    item,
    kullaniciAdi: getOzetKullaniciAdi(item),
    anketAdi: getOzetSurveyName(item),
    daysSince: getDaysSinceSonIslem(item.sonIslemTarihi),
  }))
}
