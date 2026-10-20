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

function readOptionalCount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const value = typeof raw === 'string' ? Number(raw) : raw
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : null
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
  const ekiciSayisi = readOptionalCount(row.ekiciSayisi ?? row.EkiciSayisi)

  return {
    tamamlananAnketSayisi,
    yarimKalanAnketSayisi,
    girisYokSayisi,
    toplamEkiciSayisi:
      ekiciSayisi ?? tamamlananAnketSayisi + yarimKalanAnketSayisi + girisYokSayisi,
    menseiEkiciSayisi: readOptionalCount(row.menseiEkiciSayisi ?? row.MenseiEkiciSayisi),
    bolgeEkiciSayisi: readOptionalCount(row.bolgeEkiciSayisi ?? row.BolgeEkiciSayisi),
    mintikaEkiciSayisi: readOptionalCount(row.mintikaEkiciSayisi ?? row.MintikaEkiciSayisi),
    alimNoktasiEkiciSayisi: readOptionalCount(
      row.alimNoktasiEkiciSayisi ?? row.AlimNoktasiEkiciSayisi,
    ),
    koyEkiciSayisi: readOptionalCount(row.koyEkiciSayisi ?? row.KoyEkiciSayisi),
  }
}
