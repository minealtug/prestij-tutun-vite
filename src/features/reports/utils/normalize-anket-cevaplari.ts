import type {
  AnketCevaplariReport,
  AnketCevapRow,
} from '../types/anket-cevaplari.types'

type Raw = Record<string, unknown>

function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' ? (value as Raw) : {}
}

function str(value: unknown): string {
  if (value == null) return ''
  return typeof value === 'string' ? value : String(value)
}

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(str) : []
}

/** "03.09.1996 00:00" -> "03.09.1996" (saat kısmını at) */
function toDateOnly(value: unknown): string {
  const s = str(value).trim()
  if (!s) return ''
  return s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '').trim()
}

export function normalizeAnketCevaplariReport(raw: unknown): AnketCevaplariReport {
  const root = asRecord(raw)
  const soruKolonlari = toStringArray(root.soruKolonlari ?? root.SoruKolonlari)
  const satirlarRaw = Array.isArray(root.satirlar ?? root.Satirlar)
    ? ((root.satirlar ?? root.Satirlar) as unknown[])
    : []

  const satirlar: AnketCevapRow[] = satirlarRaw.map((item, index) => {
    const row = asRecord(item)
    return {
      rowKey: `${str(row.ekiciId)}-${index}`,
      ekiciId: str(row.ekiciId),
      baslikId: num(row.baslikId),
      sablonId: num(row.sablonId),
      anketAdi: str(row.anketAdi),
      mensei: str(row.mensei),
      mintika: str(row.mintika),
      alimNoktasi: str(row.alimNoktasi),
      koy: str(row.koy),
      tc: str(row.tc),
      adi: str(row.adi),
      soyadi: str(row.soyadi),
      dogumTarihi: toDateOnly(row.dogumTarihi),
      sozlesmeKg: num(row.sozlesmeKg),
      donum: num(row.donum),
      cinsiyet: str(row.cinsiyet),
      ekiciYasAraligi: str(row.ekiciYasAraligi),
      uretimiYapan: str(row.uretimiYapan),
      cevaplar: toStringArray(row.cevaplar),
    }
  })

  return { soruKolonlari, satirlar }
}
