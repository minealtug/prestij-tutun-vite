import type { AnketGirisDurumuSayilari } from '../types/survey-response.types'

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
}

function readCount(raw: unknown): number {
  const value = typeof raw === 'string' ? Number(raw) : raw
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

export function mapAnketGirisDurumuSayilari(raw: unknown): AnketGirisDurumuSayilari {
  const row = asRecord(raw)
  const tamamlananAnketSayisi = readCount(
    row.tamamlananAnketSayisi ?? row.TamamlananAnketSayisi,
  )
  const yarimKalanAnketSayisi = readCount(
    row.yarimKalanAnketSayisi ?? row.YarimKalanAnketSayisi,
  )
  const girisYokSayisi = readCount(row.girisYokSayisi ?? row.GirisYokSayisi)

  return {
    tamamlananAnketSayisi,
    yarimKalanAnketSayisi,
    girisYokSayisi,
    toplamEkiciSayisi: tamamlananAnketSayisi + yarimKalanAnketSayisi + girisYokSayisi,
  }
}
