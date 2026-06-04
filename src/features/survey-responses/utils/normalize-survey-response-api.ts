import type {
  AnketCevapDetayDto,
  AnketCevapDegerDto,
  AnketCevapOzetItem,
  AnketSoruCevapDto,
} from '../types/survey-response.types'
import { getAnketCevapRowId } from '../types/survey-response.types'

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function normalizeCevapDeger(raw: unknown): AnketCevapDegerDto | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  return {
    cevapAltSecenekAdi: pick(row, 'cevapAltSecenekAdi', 'CevapAltSecenekAdi') ?? null,
    cevapText: pick(row, 'cevapText', 'CevapText') ?? null,
  }
}

function normalizeSoruCevap(raw: unknown): AnketSoruCevapDto | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const soruId = Number(pick(row, 'soruId', 'SoruId') ?? 0)
  if (!Number.isFinite(soruId)) return null

  const cevapRaw = pick(row, 'cevap', 'Cevap')
  return {
    sira: Number(pick(row, 'sira', 'Sira') ?? soruId),
    soruId,
    soruMetni: String(pick(row, 'soruMetni', 'SoruMetni') ?? '-'),
    altSoruMetni: pick(row, 'altSoruMetni', 'AltSoruMetni') ?? null,
    bagliSoru: Boolean(pick(row, 'bagliSoru', 'BagliSoru') ?? false),
    bagliOlduguSoruId: pick(row, 'bagliOlduguSoruId', 'BagliOlduguSoruId') ?? null,
    yanitlandi: Boolean(pick(row, 'yanitlandi', 'Yanitlandi') ?? false),
    cevap: cevapRaw ? normalizeCevapDeger(cevapRaw) : null,
  }
}

export function mapAnketCevapOzetFromApi(raw: unknown): AnketCevapOzetItem | null {
  const row = asRecord(raw)
  const ekiciId = String(pick(row, 'ekiciId', 'EkiciId') ?? '')
  if (!ekiciId) return null

  const sablonId = Number(pick(row, 'sablonId', 'SablonId') ?? 0)
  if (!Number.isFinite(sablonId) || sablonId <= 0) return null

  const baslikIdRaw = Number(pick(row, 'baslikId', 'BaslikId') ?? NaN)
  const baslikId = Number.isFinite(baslikIdRaw) && baslikIdRaw > 0 ? baslikIdRaw : undefined

  return {
    id: getAnketCevapRowId(ekiciId, sablonId),
    ekiciId,
    baslikId,
    sablonId,
    ekiciAd: String(pick(row, 'ekiciAd', 'EkiciAd') ?? ''),
    ekiciSoyad: String(pick(row, 'ekiciSoyad', 'EkiciSoyad') ?? ''),
    mintikaAdi: String(pick(row, 'mintikaAdi', 'MintikaAdi') ?? ''),
    baslikAdi: String(pick(row, 'baslikAdi', 'BaslikAdi') ?? ''),
    sablonAdi: String(pick(row, 'sablonAdi', 'SablonAdi') ?? ''),
    sonIslemTarihi: String(pick(row, 'sonIslemTarihi', 'SonIslemTarihi') ?? ''),
    yanitlananSoruSayisi: Number(pick(row, 'yanitlananSoruSayisi', 'YanitlananSoruSayisi') ?? 0),
    yanitlanmayanSoruSayisi: Number(
      pick(row, 'yanitlanmayanSoruSayisi', 'YanitlanmayanSoruSayisi') ?? 0,
    ),
  }
}

export function mapAnketCevapDetayFromApi(raw: unknown): AnketCevapDetayDto {
  const row = asRecord(raw)
  const sorularRaw = pick<unknown[]>(row, 'sorular', 'Sorular') ?? []
  const sorular = sorularRaw
    .map(normalizeSoruCevap)
    .filter((item): item is AnketSoruCevapDto => item !== null)
    .sort((a, b) => a.sira - b.sira)

  const yanitlanmayanFromApi = Number(
    pick(row, 'yanitlanmayanSoruSayisi', 'YanitlanmayanSoruSayisi') ?? NaN,
  )
  const yanitlanmayanSoruSayisi = Number.isFinite(yanitlanmayanFromApi)
    ? yanitlanmayanFromApi
    : sorular.filter((soru) => !soru.yanitlandi).length

  return { sorular, yanitlanmayanSoruSayisi }
}
