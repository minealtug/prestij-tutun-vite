import type {
  AnketCevapDegerDto,
  AnketCevapGrupDto,
  AnketSoruCevapDto,
  YanitlanmayanSoruDto,
} from '../types/survey-response.types'

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
  const id = String(pick(row, 'id', 'Id') ?? '')
  if (!id) return null

  return {
    id,
    soruId: Number(pick(row, 'soruId', 'SoruId') ?? 0),
    soruMetni: String(pick(row, 'soruMetni', 'SoruMetni') ?? ''),
    ekiciId: String(pick(row, 'ekiciId', 'EkiciId') ?? ''),
    ekiciAd: String(pick(row, 'ekiciAd', 'EkiciAd') ?? ''),
    ekiciSoyad: String(pick(row, 'ekiciSoyad', 'EkiciSoyad') ?? ''),
    sablonId: Number(pick(row, 'sablonId', 'SablonId') ?? 0),
    sablonAdi: String(pick(row, 'sablonAdi', 'SablonAdi') ?? ''),
    mintikaId: Number(pick(row, 'mintikaId', 'MintikaId') ?? 0),
    mintikaAdi: String(pick(row, 'mintikaAdi', 'MintikaAdi') ?? ''),
    kullaniciId: Number(pick(row, 'kullaniciId', 'KullaniciId') ?? 0),
    islemTarihi: String(pick(row, 'islemTarihi', 'IslemTarihi') ?? ''),
    cevapAltSecenekId: pick(row, 'cevapAltSecenekId', 'CevapAltSecenekId') ?? null,
    cevapAltSecenekAdi: pick(row, 'cevapAltSecenekAdi', 'CevapAltSecenekAdi') ?? null,
    cevapText: pick(row, 'cevapText', 'CevapText') ?? null,
    cevapNumeric: pick(row, 'cevapNumeric', 'CevapNumeric') ?? null,
    cevapDatetime: pick(row, 'cevapDatetime', 'CevapDatetime') ?? null,
    birimId: pick(row, 'birimId', 'BirimId') ?? null,
    kaynak: pick(row, 'kaynak', 'Kaynak') ?? null,
  }
}

function normalizeBagliOlduguSoruText(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const text = raw.trim()
    return text.length > 0 ? text : null
  }
  if (raw && typeof raw === 'object') {
    const row = raw as Record<string, unknown>
    const text = String(pick(row, 'soruMetni', 'SoruMetni') ?? '').trim()
    return text.length > 0 ? text : null
  }
  return null
}

function normalizeYanitlanmayanSoru(raw: unknown): YanitlanmayanSoruDto | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = Number(pick(row, 'id', 'Id'))
  if (!Number.isFinite(id) || id <= 0) return null

  return {
    id,
    baslikId: Number(pick(row, 'baslikId', 'BaslikId') ?? 0),
    baslikAdi: pick(row, 'baslikAdi', 'BaslikAdi') ?? null,
    cevapGirdiTipAdi: pick(row, 'cevapGirdiTipAdi', 'CevapGirdiTipAdi') ?? null,
    soruMetni: String(pick(row, 'soruMetni', 'SoruMetni') ?? '-'),
    altSoruMetni: pick(row, 'altSoruMetni', 'AltSoruMetni') ?? null,
    zorunlu: Boolean(pick(row, 'zorunlu', 'Zorunlu') ?? false),
    aktif: Boolean(pick(row, 'aktif', 'Aktif') ?? true),
    secenekGrupId: pick(row, 'secenekGrupId', 'SecenekGrupId') ?? null,
    bagliSoru: Boolean(pick(row, 'bagliSoru', 'BagliSoru') ?? false),
    bagliOlduguSoruId: pick(row, 'bagliOlduguSoruId', 'BagliOlduguSoruId') ?? null,
    bagliOlduguSoru: pick(row, 'bagliOlduguSoru', 'BagliOlduguSoru') ?? null,
    kaynak: pick(row, 'kaynak', 'Kaynak') ?? null,
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
    zorunlu: Boolean(pick(row, 'zorunlu', 'Zorunlu') ?? false),
    bagliSoru: Boolean(pick(row, 'bagliSoru', 'BagliSoru') ?? false),
    yanitlandi: Boolean(pick(row, 'yanitlandi', 'Yanitlandi') ?? false),
    cevap: cevapRaw ? normalizeCevapDeger(cevapRaw) : null,
  }
}

export function mapAnketCevapGrupFromApi(raw: unknown): AnketCevapGrupDto | null {
  const row = asRecord(raw)
  const ekiciId = String(pick(row, 'ekiciId', 'EkiciId') ?? '')
  if (!ekiciId) return null

  const baslikId = Number(pick(row, 'baslikId', 'BaslikId') ?? 0)
  const sablonId = Number(pick(row, 'sablonId', 'SablonId') ?? baslikId)
  const resolvedBaslikId = baslikId > 0 ? baslikId : sablonId

  const sorularRaw = pick<unknown[]>(row, 'sorular', 'Sorular') ?? []
  const yanitlananRaw = pick<unknown[]>(row, 'yanitlananSorular', 'YanitlananSorular') ?? []
  const yanitlanmayanRaw =
    pick<unknown[]>(row, 'yanitlanmayanSorular', 'YanitlanmayanSorular') ?? []

  const sorular = sorularRaw
    .map(normalizeSoruCevap)
    .filter((item): item is AnketSoruCevapDto => item !== null)
  const yanitlananSorular = yanitlananRaw
    .map(normalizeCevapDeger)
    .filter((item): item is AnketCevapDegerDto => item !== null)
  const yanitlanmayanSorular = yanitlanmayanRaw
    .map(normalizeYanitlanmayanSoru)
    .filter((item): item is YanitlanmayanSoruDto => item !== null)

  return {
    ekiciId,
    ekiciAd: String(pick(row, 'ekiciAd', 'EkiciAd') ?? ''),
    ekiciSoyad: String(pick(row, 'ekiciSoyad', 'EkiciSoyad') ?? ''),
    mintikaId: Number(pick(row, 'mintikaId', 'MintikaId') ?? 0),
    mintikaAdi: String(pick(row, 'mintikaAdi', 'MintikaAdi') ?? ''),
    sablonId: resolvedBaslikId,
    sablonAdi: String(pick(row, 'sablonAdi', 'SablonAdi') ?? ''),
    baslikId: resolvedBaslikId,
    baslikAdi: String(pick(row, 'baslikAdi', 'BaslikAdi', 'sablonAdi', 'SablonAdi') ?? ''),
    sonIslemTarihi: String(pick(row, 'sonIslemTarihi', 'SonIslemTarihi') ?? ''),
    yanitlananSoruSayisi: Number(
      pick(row, 'yanitlananSoruSayisi', 'YanitlananSoruSayisi') ?? yanitlananSorular.length,
    ),
    yanitlanmayanSoruSayisi: Number(
      pick(row, 'yanitlanmayanSoruSayisi', 'YanitlanmayanSoruSayisi') ??
        yanitlanmayanSorular.length,
    ),
    sorular,
    yanitlananSorular,
    yanitlanmayanSorular,
  }
}

export function getBagliOlduguSoruText(soru: YanitlanmayanSoruDto): string | null {
  return normalizeBagliOlduguSoruText(soru.bagliOlduguSoru)
}
