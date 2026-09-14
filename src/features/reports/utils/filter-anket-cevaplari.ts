import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'

function compareAdi(left: string, right: string): number {
  const a = left.trim()
  const b = right.trim()
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b, 'tr-TR', { sensitivity: 'base' })
}

function compareGroupedRows(a: AnketCevapRow, b: AnketCevapRow): number {
  return (
    compareAdi(a.mintika, b.mintika) ||
    compareAdi(a.alimNoktasi, b.alimNoktasi) ||
    compareAdi(a.koy, b.koy) ||
    compareAdi(a.adi, b.adi) ||
    compareAdi(a.soyadi, b.soyadi)
  )
}

export function filterAnketCevapRows(
  rows: AnketCevapRow[],
  geo: CografiFiltreQueryParams,
): AnketCevapRow[] {
  const { menseiId, bolgeId, mintikaId, alimNoktasiId, koyId } = geo
  const filtered =
    !menseiId && !bolgeId && !mintikaId && !alimNoktasiId && !koyId
      ? rows
      : rows.filter((row) => {
          if (menseiId && row.menseiId !== menseiId) return false
          if (bolgeId && row.bolgeId !== bolgeId) return false
          if (mintikaId && row.mintikaId !== mintikaId) return false
          if (alimNoktasiId && row.alimNoktasiId !== alimNoktasiId) return false
          if (koyId && row.koyId !== koyId) return false
          return true
        })

  return [...filtered].sort(compareGroupedRows)
}
