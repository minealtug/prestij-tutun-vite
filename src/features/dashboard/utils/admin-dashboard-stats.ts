import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { getSurveyResponseStatus } from './user-dashboard-survey-groups'

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
  totalEkiciler: number
  filledEkiciler: number
  neverFilled: number
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

function indexEkicilerById(
  ekiciById: Map<string, EkiciDefinitionDto>,
): Map<string, EkiciDefinitionDto> {
  const byLowerId = new Map<string, EkiciDefinitionDto>()
  for (const [id, ekici] of ekiciById) {
    const key = id.trim().toLowerCase()
    if (key) byLowerId.set(key, ekici)
  }
  return byLowerId
}

function mintikaIsSelected(
  mintikaId: number | null | undefined,
  mintikaIdSet: Set<number> | null,
): boolean {
  return mintikaIdSet != null && mintikaId != null && mintikaId > 0 && mintikaIdSet.has(mintikaId)
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
  const ekiciByLowerId = indexEkicilerById(ekiciById)
  const strictPlace = params.alimNoktasiId != null || params.koyId != null

  return items.filter((item) => {
    const ekici = ekiciByLowerId.get(item.ekiciId.trim().toLowerCase())

    if (strictPlace) {
      if (ekici) return matchesEkiciCografiFiltre(ekici, params)
      return mintikaIsSelected(item.mintikaId, mintikaIdSet)
    }

    if (ekici && matchesEkiciCografiFiltre(ekici, params)) return true
    // Cevabın kendi mıntıkası da geçerli. Ekici kartındaki menşei/bölge kimliği
    // seçilen filtreyle uyuşmasa bile form o mıntıkada görünür.
    if (mintikaIsSelected(item.mintikaId, mintikaIdSet)) return true
    if (mintikaIsSelected(ekici?.mintikaId, mintikaIdSet)) return true
    if (!mintikaIdSet && !ekici) return true
    return false
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
): AdminEkiciActivitySummary {
  const knownIds = new Set(ekiciler.map((ekici) => ekici.id).filter(Boolean))
  const filledKeys = new Set<string>()

  for (const item of surveys) {
    const key = normalizeEkiciKey(item.ekiciId)
    if (!key || !knownIds.has(key)) continue
    filledKeys.add(key)
  }

  let activeEkiciler = 0
  let neverFilled = 0

  for (const ekici of ekiciler) {
    if (ekici.aktif === 1) activeEkiciler += 1
    if (!filledKeys.has(ekici.id)) neverFilled += 1
  }

  return {
    activeEkiciler,
    totalEkiciler: ekiciler.length,
    filledEkiciler: filledKeys.size,
    neverFilled,
  }
}
