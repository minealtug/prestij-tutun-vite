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

function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR')
}

export function matchesAnketCevapYil(
  ekiciId: string,
  yilByEkiciId: ReadonlyMap<string, number>,
  yilFilter: string,
): boolean {
  if (!yilFilter || yilFilter === 'all') return true
  const year = Number(yilFilter)
  if (!Number.isFinite(year)) return true
  return yilByEkiciId.get(ekiciId.trim().toLowerCase()) === year
}

export function buildAnketCevapYilOptions(years: Iterable<number>, selected: string) {
  const uniqueYears = new Set<number>()
  const currentYear = new Date().getFullYear()
  if (currentYear > 0) uniqueYears.add(currentYear)

  const selectedYear = Number(selected)
  if (selected && selected !== 'all' && Number.isFinite(selectedYear) && selectedYear > 0) {
    uniqueYears.add(selectedYear)
  }

  for (const year of years) {
    if (Number.isFinite(year) && year > 0) uniqueYears.add(year)
  }

  return [
    { value: 'all', label: 'Tümü' },
    ...[...uniqueYears]
      .sort((a, b) => b - a)
      .map((year) => ({ value: String(year), label: String(year) })),
  ]
}

/** API'den gelen ekiciAd + ekiciSoyad birleşiminde parça eşleşmesi. */
export function matchesEkiciAdSoyadSearch(
  item: Pick<AnketCevapOzetItem, 'ekiciAd' | 'ekiciSoyad'>,
  query: string,
): boolean {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  const fullName = normalizeSearchText(
    [item.ekiciAd, item.ekiciSoyad].filter((part) => part.trim()).join(' '),
  )
  return fullName.includes(normalizedQuery)
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
