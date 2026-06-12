import type { AnketCevapOzetItem, SurveyResponsesQueryParams } from '../types/survey-response.types'

function normalizeAnketAdi(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR')
}

function rowMatchesBaslikId(item: AnketCevapOzetItem, baslikId: number): boolean {
  return item.baslikId != null && item.baslikId === baslikId
}

function rowMatchesAnketAdi(item: AnketCevapOzetItem, anketAdi: string): boolean {
  const target = normalizeAnketAdi(anketAdi)
  const baslik = item.baslikAdi?.trim()
  if (baslik && normalizeAnketAdi(baslik) === target) return true

  const sablon = item.sablonAdi?.trim()
  if (sablon && normalizeAnketAdi(sablon) === target) return true

  return false
}

export function filterAnketCevapList(
  items: AnketCevapOzetItem[],
  params: SurveyResponsesQueryParams,
): AnketCevapOzetItem[] {
  const { baslikId, anketAdi } = params
  if (baslikId == null && !anketAdi?.trim()) return items

  return items.filter((item) => {
    if (baslikId != null && rowMatchesBaslikId(item, baslikId)) return true
    if (anketAdi?.trim() && rowMatchesAnketAdi(item, anketAdi)) return true
    return false
  })
}
