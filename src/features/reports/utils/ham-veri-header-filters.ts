import type { YasCinsiyetRow, YasCinsiyetTotals } from '../types/yas-cinsiyet-report.types'

export const HAM_VERI_FILTER_KEYS = [
  'menseiAd',
  'bolgeAd',
  'mintikaAd',
  'alimNoktasiAd',
] as const

export type HamVeriFilterKey = (typeof HAM_VERI_FILTER_KEYS)[number]

export type HamVeriHeaderFilters = Partial<Record<HamVeriFilterKey, ReadonlySet<string>>>

export const HAM_VERI_FILTER_COLUMNS: { key: HamVeriFilterKey; header: string }[] = [
  { key: 'menseiAd', header: 'Menşei' },
  { key: 'bolgeAd', header: 'Bölge' },
  { key: 'mintikaAd', header: 'Mıntıka' },
  { key: 'alimNoktasiAd', header: 'Alım Noktası' },
]

function cellValue(row: YasCinsiyetRow, key: HamVeriFilterKey): string {
  return String(row[key] ?? '').trim()
}

export function uniqueHamVeriValues(rows: YasCinsiyetRow[], key: HamVeriFilterKey): string[] {
  const values = new Set<string>()
  for (const row of rows) values.add(cellValue(row, key))
  return [...values].sort((a, b) => {
    if (!a && !b) return 0
    if (!a) return 1
    if (!b) return -1
    return a.localeCompare(b, 'tr-TR', { sensitivity: 'base' })
  })
}

export function applyHamVeriHeaderFilters(
  rows: YasCinsiyetRow[],
  filters: HamVeriHeaderFilters,
): YasCinsiyetRow[] {
  return rows.filter((row) => {
    for (const key of HAM_VERI_FILTER_KEYS) {
      const selected = filters[key]
      if (!selected) continue
      if (!selected.has(cellValue(row, key))) return false
    }
    return true
  })
}

export function hamVeriRowsForColumnOptions(
  rows: YasCinsiyetRow[],
  filters: HamVeriHeaderFilters,
  column: HamVeriFilterKey,
): YasCinsiyetRow[] {
  const others: HamVeriHeaderFilters = { ...filters }
  delete others[column]
  return applyHamVeriHeaderFilters(rows, others)
}

export function sumHamVeriTotals(
  rows: YasCinsiyetRow[],
  bandKeys: string[],
): YasCinsiyetTotals {
  const bands: YasCinsiyetTotals['bands'] = {}
  for (const key of bandKeys) {
    bands[key] = { erkek: 0, kadin: 0, toplam: 0 }
  }

  let grupToplam = 0
  for (const row of rows) {
    grupToplam += row.grupToplam ?? 0
    for (const key of bandKeys) {
      const value = row.bands[key]
      if (!value) continue
      const bucket = bands[key]
      bucket.erkek += value.erkek
      bucket.kadin += value.kadin
      bucket.toplam += value.toplam
    }
  }

  return { bands, grupToplam }
}
