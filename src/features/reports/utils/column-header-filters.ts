import type { AnketCevapRow } from '../types/anket-cevaplari.types'

export const HEADER_FILTER_KEYS = [
  'anketAdi',
  'mensei',
  'mintika',
  'alimNoktasi',
  'koy',
  'tc',
  'adi',
  'soyadi',
] as const

export type HeaderFilterKey = (typeof HEADER_FILTER_KEYS)[number]

export type ColumnHeaderFilters = Partial<Record<HeaderFilterKey, ReadonlySet<string>>>

export function isHeaderFilterKey(key: string): key is HeaderFilterKey {
  return (HEADER_FILTER_KEYS as readonly string[]).includes(key)
}

export function cellFilterValue(row: AnketCevapRow, key: HeaderFilterKey): string {
  return String(row[key] ?? '').trim()
}

export function uniqueColumnValues(rows: AnketCevapRow[], key: HeaderFilterKey): string[] {
  const values = new Set<string>()
  for (const row of rows) values.add(cellFilterValue(row, key))
  return [...values].sort((a, b) => {
    if (!a && !b) return 0
    if (!a) return 1
    if (!b) return -1
    return a.localeCompare(b, 'tr-TR', { sensitivity: 'base' })
  })
}

export function applyColumnHeaderFilters(
  rows: AnketCevapRow[],
  filters: ColumnHeaderFilters,
): AnketCevapRow[] {
  return rows.filter((row) => {
    for (const key of HEADER_FILTER_KEYS) {
      const selected = filters[key]
      if (!selected) continue
      if (!selected.has(cellFilterValue(row, key))) return false
    }
    return true
  })
}

export function rowsForColumnOptions(
  rows: AnketCevapRow[],
  filters: ColumnHeaderFilters,
  column: HeaderFilterKey,
): AnketCevapRow[] {
  const others: ColumnHeaderFilters = { ...filters }
  delete others[column]
  return applyColumnHeaderFilters(rows, others)
}
