import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import type { EkiciDefinitionDto } from '../types/ekici-definition.types'
import type { MyEkiciTableRow } from '../components/MyEkicilerTable'
import { resolveEkiciAnketDurumu } from './ekici-anket-durumu'

function pickLatestCevapRow(rows: AnketCevapOzetItem[]): AnketCevapOzetItem | null {
  if (rows.length === 0) return null
  return rows.reduce((latest, row) => {
    const latestDate = latest.sonIslemTarihi?.trim() ?? ''
    const rowDate = row.sonIslemTarihi?.trim() ?? ''
    return rowDate >= latestDate ? row : latest
  })
}

export function getLatestCevapForEkici(
  ekiciId: string,
  filteredCevaplar: AnketCevapOzetItem[],
): AnketCevapOzetItem | null {
  const rows = filteredCevaplar.filter(
    (cevap) => cevap.ekiciId.trim().toLowerCase() === ekiciId.trim().toLowerCase(),
  )
  return pickLatestCevapRow(rows)
}

export function buildMyEkiciTableRows(
  ekiciler: EkiciDefinitionDto[],
  filteredCevaplar: AnketCevapOzetItem[],
  anketSelected: boolean,
  minCompletedAnswerCount?: number,
): MyEkiciTableRow[] {
  const cevaplarByEkiciId = new Map<string, AnketCevapOzetItem[]>()

  for (const cevap of filteredCevaplar) {
    const ekiciId = cevap.ekiciId.trim().toLowerCase()
    if (!ekiciId) continue
    const bucket = cevaplarByEkiciId.get(ekiciId) ?? []
    bucket.push(cevap)
    cevaplarByEkiciId.set(ekiciId, bucket)
  }

  return ekiciler.map((ekici) => {
    if (!anketSelected) {
      return {
        ...ekici,
        yanitlananSoruSayisi: null,
        yanitlanmayanSoruSayisi: null,
        anketDurumu: resolveEkiciAnketDurumu(null, null, false),
      }
    }

    const rows = cevaplarByEkiciId.get(ekici.id.trim().toLowerCase()) ?? []
    const latest = pickLatestCevapRow(rows)
    const yanitlananSoruSayisi = latest?.yanitlananSoruSayisi ?? 0
    const yanitlanmayanSoruSayisi = latest?.yanitlanmayanSoruSayisi ?? 0

    return {
      ...ekici,
      yanitlananSoruSayisi,
      yanitlanmayanSoruSayisi,
      anketDurumu: resolveEkiciAnketDurumu(
        yanitlananSoruSayisi,
        yanitlanmayanSoruSayisi,
        true,
        minCompletedAnswerCount,
      ),
    }
  })
}
