import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'

export interface EkiciLocationLookup {
  mintikaId?: number | null
  menseiAdi?: string | null
  bolgeAdi?: string | null
  mintikaAdi?: string | null
}

export function resolveSurveyMintikaAdi(
  item: Pick<AnketCevapOzetItem, 'ekiciId' | 'mintikaId' | 'mintikaAdi'>,
  ekiciById: Map<string, EkiciLocationLookup>,
  mintikaById: Map<number, string>,
): string {
  const ekici = ekiciById.get(item.ekiciId)
  if (ekici?.mintikaAdi?.trim()) return ekici.mintikaAdi.trim()

  const mintikaId = ekici?.mintikaId ?? item.mintikaId
  if (mintikaId != null && mintikaId > 0) {
    const fromLookup = mintikaById.get(mintikaId)?.trim()
    if (fromLookup) return fromLookup
  }

  return item.mintikaAdi?.trim() || 'Belirtilmemiş'
}

export function enrichSurveyWithEkiciLocation(
  item: AnketCevapOzetItem,
  ekiciById: Map<string, EkiciLocationLookup>,
  mintikaById: Map<number, string> = new Map(),
): AnketCevapOzetItem {
  const ekici = ekiciById.get(item.ekiciId)

  return {
    ...item,
    mintikaAdi: resolveSurveyMintikaAdi(item, ekiciById, mintikaById),
    bolgeAdi: ekici?.bolgeAdi?.trim() || item.bolgeAdi?.trim() || undefined,
    menseiAdi: ekici?.menseiAdi?.trim() || item.menseiAdi?.trim() || undefined,
  }
}

export function enrichSurveysWithEkiciLocations(
  items: AnketCevapOzetItem[],
  ekiciById: Map<string, EkiciLocationLookup>,
  mintikaById: Map<number, string> = new Map(),
): AnketCevapOzetItem[] {
  if (ekiciById.size === 0 && mintikaById.size === 0) return items
  return items.map((item) => enrichSurveyWithEkiciLocation(item, ekiciById, mintikaById))
}
