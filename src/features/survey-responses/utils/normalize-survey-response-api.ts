import type { AnketCevapDto, YanitlanmayanSoruDto, YanitlanmayanSorularDto } from '../types/survey-response.types'

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
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
    bagliOlduguSoru: null,
    kaynak: pick(row, 'kaynak', 'Kaynak') ?? null,
  }
}

export function normalizeYanitlanmayanSorularDto(raw: unknown): YanitlanmayanSorularDto {
  if (!raw || typeof raw !== 'object') {
    return {
      ekiciId: '',
      baslikId: 0,
      yanitlanmayanSoruSayisi: 0,
      yanitlanmayanSorular: [],
    }
  }

  const row = raw as Record<string, unknown>
  const sorularRaw = pick<unknown[]>(row, 'yanitlanmayanSorular', 'YanitlanmayanSorular') ?? []
  const yanitlanmayanSorular = sorularRaw
    .map(normalizeYanitlanmayanSoru)
    .filter((item): item is YanitlanmayanSoruDto => item !== null)

  return {
    ekiciId: String(pick(row, 'ekiciId', 'EkiciId') ?? ''),
    baslikId: Number(pick(row, 'baslikId', 'BaslikId') ?? 0),
    baslikAdi: pick(row, 'baslikAdi', 'BaslikAdi') ?? null,
    yanitlanmayanSoruSayisi: Number(
      pick(row, 'yanitlanmayanSoruSayisi', 'YanitlanmayanSoruSayisi') ?? yanitlanmayanSorular.length,
    ),
    yanitlanmayanSorular,
  }
}

export function mapAnketCevapFromApi(raw: unknown): AnketCevapDto {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const baslikId = Number(pick(row, 'baslikId', 'BaslikId') ?? 0)
  const sablonId = Number(pick(row, 'sablonId', 'SablonId') ?? baslikId ?? 0)
  const resolvedBaslikId = baslikId > 0 ? baslikId : sablonId

  return {
    id: String(pick(row, 'id', 'Id') ?? ''),
    soruId: Number(pick(row, 'soruId', 'SoruId') ?? 0),
    soruMetni: String(pick(row, 'soruMetni', 'SoruMetni') ?? ''),
    ekiciId: String(pick(row, 'ekiciId', 'EkiciId') ?? ''),
    ekiciAd: String(pick(row, 'ekiciAd', 'EkiciAd') ?? ''),
    ekiciSoyad: String(pick(row, 'ekiciSoyad', 'EkiciSoyad') ?? ''),
    sablonId: resolvedBaslikId,
    sablonAdi: String(pick(row, 'sablonAdi', 'SablonAdi', 'baslikAdi', 'BaslikAdi') ?? ''),
    baslikId: resolvedBaslikId,
    menseiId: pick(row, 'menseiId', 'MenseiId') ?? null,
    menseiAdi: pick(row, 'menseiAdi', 'MenseiAdi') ?? null,
    bolgeId: pick(row, 'bolgeId', 'BolgeId') ?? null,
    bolgeAdi: pick(row, 'bolgeAdi', 'BolgeAdi') ?? null,
    alimNoktasiId: pick(row, 'alimNoktasiId', 'AlimNoktasiId') ?? null,
    alimNoktasiAdi: pick(row, 'alimNoktasiAdi', 'AlimNoktasiAdi') ?? null,
    mintikaId: Number(pick(row, 'mintikaId', 'MintikaId') ?? 0),
    mintikaAdi: String(pick(row, 'mintikaAdi', 'MintikaAdi') ?? ''),
    koyId: pick(row, 'koyId', 'KoyId') ?? null,
    koyAdi: pick(row, 'koyAdi', 'KoyAdi') ?? null,
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
