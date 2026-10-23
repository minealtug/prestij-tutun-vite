import type {
  YarimFormUyarisi,
  YarimFormUyarisiKayit,
} from '../types/yarim-form-uyarisi.types'
import { pick } from './normalize-survey-response-api'

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
}

function readString(raw: unknown): string {
  return raw != null ? String(raw).trim() : ''
}

function readCount(raw: unknown): number {
  const value = typeof raw === 'string' ? Number(raw) : raw
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

function readOptionalCount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const value = typeof raw === 'string' ? Number(raw) : raw
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : null
}

function readPositiveId(raw: unknown): number | undefined {
  const value = readCount(raw)
  return value > 0 ? value : undefined
}

function readBool(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw
  if (raw === 1 || raw === '1' || raw === 'true') return true
  if (raw === 0 || raw === '0' || raw === 'false') return false
  return false
}

function readQuestionText(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim()
  const row = asRecord(raw)
  return readString(pick(row, 'soruMetni', 'SoruMetni', 'metin', 'Metin', 'adi', 'Adi'))
}

function readQuestionList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const questions: string[] = []
  for (const item of raw) {
    const text = readQuestionText(item)
    if (!text || seen.has(text)) continue
    seen.add(text)
    questions.push(text)
  }
  return questions
}

function mapKayit(raw: unknown): YarimFormUyarisiKayit | null {
  const row = asRecord(raw)
  const ekiciId = readString(pick(row, 'ekiciId', 'EkiciId'))
  const sablonId = readCount(pick(row, 'sablonId', 'SablonId'))
  if (!ekiciId || sablonId <= 0) return null

  const baslikId = readPositiveId(pick(row, 'baslikId', 'BaslikId'))
  const id = readString(pick(row, 'id', 'Id')) || `${ekiciId}|${baslikId ?? 0}|${sablonId}`

  return {
    id,
    ekiciId,
    ekiciAd: readString(pick(row, 'ekiciAd', 'EkiciAd')),
    ekiciSoyad: readString(pick(row, 'ekiciSoyad', 'EkiciSoyad')),
    kullaniciAdi: readString(pick(row, 'kullaniciAdi', 'KullaniciAdi')),
    anketAdi: readString(pick(row, 'anketAdi', 'AnketAdi', 'baslikAdi', 'BaslikAdi')),
    mintikaAdi: readString(pick(row, 'mintikaAdi', 'MintikaAdi')),
    baslikId,
    sablonId,
    sonIslemTarihi: readString(pick(row, 'sonIslemTarihi', 'SonIslemTarihi')),
    beklemeGunu: readOptionalCount(pick(row, 'beklemeGunu', 'BeklemeGunu')),
    yanitlananSoruSayisi: readCount(pick(row, 'yanitlananSoruSayisi', 'YanitlananSoruSayisi')),
    yanitlanmayanSoruSayisi: readCount(
      pick(row, 'yanitlanmayanSoruSayisi', 'YanitlanmayanSoruSayisi'),
    ),
    eksikSorular: readQuestionList(pick(row, 'eksikSorular', 'EksikSorular')),
    eskiyen: readBool(pick(row, 'eskiyen', 'Eskiyen')),
  }
}

const EMPTY_UYARI: YarimFormUyarisi = { adet: 0, kayitlar: [] }

export function emptyYarimFormUyarisi(): YarimFormUyarisi {
  return EMPTY_UYARI
}

export function mapYarimFormUyarisi(raw: unknown): YarimFormUyarisi {
  if (Array.isArray(raw)) {
    const kayitlar = raw
      .map(mapKayit)
      .filter((item): item is YarimFormUyarisiKayit => item !== null)
    return {
      adet: kayitlar.filter((item) => item.eskiyen).length,
      kayitlar,
    }
  }

  const row = asRecord(raw)
  const listRaw = pick<unknown>(row, 'kayitlar', 'Kayitlar', 'items', 'Items')
  const kayitlar = (Array.isArray(listRaw) ? listRaw : [])
    .map(mapKayit)
    .filter((item): item is YarimFormUyarisiKayit => item !== null)
  const adetRaw = pick(row, 'adet', 'Adet')

  return {
    adet: adetRaw != null ? readCount(adetRaw) : kayitlar.filter((item) => item.eskiyen).length,
    kayitlar,
  }
}
