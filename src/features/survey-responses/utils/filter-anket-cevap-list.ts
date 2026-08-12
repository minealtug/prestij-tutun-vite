import type { AnketCevapOzetItem, SurveyResponsesQueryParams } from '../types/survey-response.types'

function normalizeAnketAdi(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR')
}

function rowMatchesBaslikId(item: AnketCevapOzetItem, baslikId: number): boolean {
  return item.baslikId != null && item.baslikId === baslikId
}

function rowMatchesBaslikAdi(item: AnketCevapOzetItem, anketAdi: string): boolean {
  const baslik = item.baslikAdi?.trim()
  if (!baslik) return false
  return normalizeAnketAdi(baslik) === normalizeAnketAdi(anketAdi)
}

function rowMatchesAnketAdi(item: AnketCevapOzetItem, anketAdi: string): boolean {
  if (rowMatchesBaslikAdi(item, anketAdi)) return true

  const sablon = item.sablonAdi?.trim()
  if (sablon && normalizeAnketAdi(sablon) === normalizeAnketAdi(anketAdi)) return true

  return false
}

export function filterAnketCevapList(
  items: AnketCevapOzetItem[],
  params: SurveyResponsesQueryParams,
): AnketCevapOzetItem[] {
  const { baslikId, anketAdi } = params
  if (baslikId == null && !anketAdi?.trim()) return items

  return items.filter((item) => {
    // Önce baslikId; ad eşlemesi yalnızca kayıtta baslikId yoksa (eski/eksik veri)
    if (baslikId != null) {
      if (rowMatchesBaslikId(item, baslikId)) return true
      if (item.baslikId == null && anketAdi?.trim() && rowMatchesBaslikAdi(item, anketAdi)) {
        return true
      }
      return false
    }

    if (anketAdi?.trim() && rowMatchesAnketAdi(item, anketAdi)) return true
    return false
  })
}
