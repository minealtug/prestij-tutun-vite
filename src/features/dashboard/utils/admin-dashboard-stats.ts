import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { getOzetKullaniciAdi, getOzetSurveyName } from '@/features/survey-responses/types/survey-response.types'
import type { UserDto } from '@/features/users/types/user.types'
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

export interface AdminGeoComparisonRow {
  key: string
  label: string
  completed: number
  partial: number
  total: number
  completionPercent: number
}

export interface AdminUserActivitySummary {
  activeUsers: number
  passiveUsers: number
  totalUsers: number
  filledInWindow: number
  neverFilled: number
  neverFilledUsers: UserDto[]
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

function buildGeoComparisonRows(
  items: AnketCevapOzetItem[],
  getLabel: (item: AnketCevapOzetItem) => string,
): AdminGeoComparisonRow[] {
  const map = new Map<string, { label: string; completed: number; partial: number }>()

  for (const item of items) {
    const label = getLabel(item).trim() || 'Belirtilmemiş'
    const key = label.toLocaleLowerCase('tr-TR')
    const current = map.get(key) ?? { label, completed: 0, partial: 0 }
    const status = getSurveyResponseStatus(item)
    if (status === 'completed') current.completed += 1
    else if (status === 'partial') current.partial += 1
    else continue
    map.set(key, current)
  }

  return [...map.entries()]
    .map(([key, counts]) => {
      const total = counts.completed + counts.partial
      return {
        key,
        label: counts.label,
        completed: counts.completed,
        partial: counts.partial,
        total,
        completionPercent: total > 0 ? Math.round((counts.completed / total) * 100) : 0,
      }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.completionPercent - a.completionPercent || b.total - a.total)
}

export function computeMintikaComparison(items: AnketCevapOzetItem[]): AdminGeoComparisonRow[] {
  return buildGeoComparisonRows(items, (item) => item.mintikaAdi?.trim() || 'Belirtilmemiş')
}

export function computeBolgeComparison(items: AnketCevapOzetItem[]): AdminGeoComparisonRow[] {
  return buildGeoComparisonRows(items, (item) => item.bolgeAdi?.trim() || 'Belirtilmemiş')
}

function normalizeUserKey(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase('tr-TR') ?? ''
}

export function computeAdminUserActivity(
  users: UserDto[],
  surveys: AnketCevapOzetItem[],
  dayWindow: AdminActivityDayWindow,
  now = new Date(),
): AdminUserActivitySummary {
  const windowStart = now.getTime() - dayWindow * 24 * 60 * 60 * 1000
  const filledKeys = new Set<string>()
  const filledInWindowKeys = new Set<string>()

  for (const item of surveys) {
    const key = normalizeUserKey(item.kullaniciAdi)
    if (!key || key === '—') continue
    filledKeys.add(key)
    if (isInPeriod(item, windowStart, now.getTime())) {
      filledInWindowKeys.add(key)
    }
  }

  let activeUsers = 0
  let passiveUsers = 0
  const neverFilledUsers: UserDto[] = []

  for (const user of users) {
    if (user.aktif) activeUsers += 1
    else passiveUsers += 1

    const key = normalizeUserKey(user.userName)
    if (!key || !filledKeys.has(key)) {
      neverFilledUsers.push(user)
    }
  }

  neverFilledUsers.sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'tr-TR') || a.userName.localeCompare(b.userName, 'tr-TR'),
  )

  return {
    activeUsers,
    passiveUsers,
    totalUsers: users.length,
    filledInWindow: filledInWindowKeys.size,
    neverFilled: neverFilledUsers.length,
    neverFilledUsers,
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
