import type { RecentSurveySave } from '@/features/survey-fill/stores/survey-fill-recent-store'
import type { AnketCevapOzetItem, SurveyResponsesQueryParams } from '../types/survey-response.types'
import { getAnketCevapRowId } from '../types/survey-response.types'
import { filterAnketCevapList } from './filter-anket-cevap-list'
import { sortAnketCevapOzetList } from './map-anket-cevap'

function splitEkiciAdi(ekiciAdi: string): { ekiciAd: string; ekiciSoyad: string } {
  const trimmed = ekiciAdi.trim()
  if (!trimmed) return { ekiciAd: '', ekiciSoyad: '' }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { ekiciAd: parts[0], ekiciSoyad: '' }

  return {
    ekiciAd: parts[0],
    ekiciSoyad: parts.slice(1).join(' '),
  }
}

export function mapRecentSaveToOzetItem(save: RecentSurveySave): AnketCevapOzetItem {
  const { ekiciAd, ekiciSoyad } = splitEkiciAdi(save.ekiciAdi)

  return {
    id: getAnketCevapRowId(save.ekiciId, save.sablonId, save.baslikId),
    ekiciId: save.ekiciId,
    baslikId: save.baslikId,
    sablonId: save.sablonId,
    ekiciAd,
    ekiciSoyad,
    mintikaAdi: '',
    baslikAdi: save.baslikAdi,
    sablonAdi: save.sablonAdi,
    sonIslemTarihi: new Date(save.savedAt).toISOString(),
    yanitlananSoruSayisi: save.answeredCount,
    yanitlanmayanSoruSayisi: 0,
  }
}

export function mergeRecentSavesWithResponses(
  apiItems: AnketCevapOzetItem[],
  recentSaves: RecentSurveySave[],
  params?: SurveyResponsesQueryParams,
): AnketCevapOzetItem[] {
  if (recentSaves.length === 0) return apiItems

  const filteredRecent = filterAnketCevapList(
    sortAnketCevapOzetList(recentSaves.map(mapRecentSaveToOzetItem)),
    params ?? {},
  )

  const byId = new Map<string, AnketCevapOzetItem>()
  for (const item of apiItems) {
    byId.set(item.id, item)
  }

  for (const item of filteredRecent) {
    const existing = byId.get(item.id)
    if (!existing) {
      byId.set(item.id, item)
      continue
    }

    if (existing.baslikId != null && item.baslikId != null && existing.baslikId !== item.baslikId) {
      continue
    }

    const existingTime = new Date(existing.sonIslemTarihi).getTime()
    const recentTime = new Date(item.sonIslemTarihi).getTime()
    if (recentTime >= existingTime) {
      byId.set(item.id, {
        ...existing,
        ...item,
        sonIslemTarihi: item.sonIslemTarihi,
        yanitlananSoruSayisi: Math.max(existing.yanitlananSoruSayisi, item.yanitlananSoruSayisi),
      })
    }
  }

  return sortAnketCevapOzetList([...byId.values()])
}
