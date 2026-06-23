import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { getOzetFullName, getOzetSurveyName } from '@/features/survey-responses/types/survey-response.types'
import { sortAnketCevapOzetList } from '@/features/survey-responses/utils/map-anket-cevap'
import { buildSurveyFillDeepLink } from '@/features/survey-fill/types/recent-save.types'

export type SurveyResponseStatus = 'completed' | 'partial' | 'notStarted' | 'empty'

export const PARTIAL_STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000
export const CONTINUE_SURVEY_LIST_LIMIT = 3

export function isStalePartialSurvey(
  item: Pick<AnketCevapOzetItem, 'sonIslemTarihi'>,
  now = Date.now(),
): boolean {
  const time = new Date(item.sonIslemTarihi).getTime()
  return Number.isFinite(time) && now - time >= PARTIAL_STALE_THRESHOLD_MS
}

export function getDaysSinceSonIslem(iso: string, now = Date.now()): number | null {
  if (!iso?.trim()) return null
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return null
  return Math.floor((now - time) / (1000 * 60 * 60 * 24))
}

export function sortPartialSurveysByPriority(items: AnketCevapOzetItem[]): AnketCevapOzetItem[] {
  return [...items].sort((a, b) => {
    const aStale = isStalePartialSurvey(a)
    const bStale = isStalePartialSurvey(b)
    if (aStale !== bStale) return aStale ? -1 : 1

    if (aStale && bStale) {
      const aTime = new Date(a.sonIslemTarihi).getTime()
      const bTime = new Date(b.sonIslemTarihi).getTime()
      if (aTime !== bTime) return aTime - bTime
    }

    const aProgress = getItemProgressPercent(a)
    const bProgress = getItemProgressPercent(b)
    if (aProgress !== bProgress) return aProgress - bProgress

    const aTime = new Date(a.sonIslemTarihi).getTime()
    const bTime = new Date(b.sonIslemTarihi).getTime()
    return bTime - aTime
  })
}

export function getSurveyResponseStatus(
  item: Pick<AnketCevapOzetItem, 'yanitlananSoruSayisi' | 'yanitlanmayanSoruSayisi'>,
): SurveyResponseStatus {
  const answered = Math.max(0, item.yanitlananSoruSayisi)
  const unanswered = Math.max(0, item.yanitlanmayanSoruSayisi)

  if (answered === 0 && unanswered === 0) return 'empty'
  if (unanswered === 0 && answered > 0) return 'completed'
  if (answered > 0 && unanswered > 0) return 'partial'
  return 'notStarted'
}

export function getItemProgressPercent(
  item: Pick<AnketCevapOzetItem, 'yanitlananSoruSayisi' | 'yanitlanmayanSoruSayisi'>,
): number {
  const answered = Math.max(0, item.yanitlananSoruSayisi)
  const unanswered = Math.max(0, item.yanitlanmayanSoruSayisi)
  const total = answered + unanswered
  if (total === 0) return 0
  return Math.round((answered / total) * 100)
}

export function buildSurveyFillLinkFromOzet(
  item: Pick<AnketCevapOzetItem, 'baslikId' | 'sablonId' | 'ekiciId'>,
): string | null {
  const baslikId = item.baslikId
  if (baslikId == null || baslikId <= 0) return null
  return buildSurveyFillDeepLink({
    baslikId,
    sablonId: item.sablonId,
    ekiciId: item.ekiciId,
  })
}

export function formatRelativeSonIslem(iso: string): string {
  if (!iso?.trim()) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Bugün'
  if (diffDays === 1) return 'Dün'
  if (diffDays < 7) return `${diffDays} gün önce`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export interface UserDashboardSurveyGroups {
  completed: AnketCevapOzetItem[]
  partial: AnketCevapOzetItem[]
  notStarted: AnketCevapOzetItem[]
  continueItem: AnketCevapOzetItem | null
  stalePartialCount: number
}

export function groupUserDashboardSurveys(items: AnketCevapOzetItem[]): UserDashboardSurveyGroups {
  const sorted = sortAnketCevapOzetList(items)

  const completed: AnketCevapOzetItem[] = []
  const partialRaw: AnketCevapOzetItem[] = []
  const notStarted: AnketCevapOzetItem[] = []

  for (const item of sorted) {
    const status = getSurveyResponseStatus(item)
    if (status === 'completed') completed.push(item)
    else if (status === 'partial') partialRaw.push(item)
    else if (status === 'notStarted') notStarted.push(item)
  }

  const partial = sortPartialSurveysByPriority(partialRaw)
  const continueItem = partial[0] ?? notStarted[0] ?? null

  const stalePartialCount = partial.filter((item) => isStalePartialSurvey(item)).length

  return {
    completed,
    partial,
    notStarted,
    continueItem,
    stalePartialCount,
  }
}

export function getSurveyListSubtitle(item: AnketCevapOzetItem): string {
  const ekici = getOzetFullName(item)
  const mintika = item.mintikaAdi?.trim()
  return mintika ? `${ekici} · ${mintika}` : ekici
}

export function getSurveyListTitle(item: AnketCevapOzetItem): string {
  return getOzetSurveyName(item)
}
