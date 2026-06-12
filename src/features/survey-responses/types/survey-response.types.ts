export interface FilterOptionDto {
  id: number
  adi: string
}

export interface BolgeDto extends FilterOptionDto {
  menseiId: number
}

export interface MintikaDto extends FilterOptionDto {
  bolgeId: number
}

export interface AlimNoktasiDto extends FilterOptionDto {
  mintikaId: number
}

export interface KoyDto extends FilterOptionDto {
  alimNoktasiId: number
}

export interface CografiFiltreOptionsDto {
  menseiler: FilterOptionDto[]
  bolgeler: BolgeDto[]
  mintikalar: MintikaDto[]
  alimNoktalari: AlimNoktasiDto[]
  koyler: KoyDto[]
}

export interface AnketCevapDegerDto {
  cevapAltSecenekAdi: string | null
  cevapText: string | null
}

export interface AnketSoruCevapDto {
  sira: number
  soruId: number
  soruMetni: string
  altSoruMetni?: string | null
  bagliSoru?: boolean
  bagliOlduguSoruId?: number | null
  yanitlandi: boolean
  cevap?: AnketCevapDegerDto | null
}

export interface AnketCevapOzetItem {
  id: string
  ekiciId: string
  baslikId?: number
  sablonId: number
  ekiciAd: string
  ekiciSoyad: string
  mintikaAdi: string
  baslikAdi: string
  sablonAdi: string
  kullaniciAdi?: string
  sonIslemTarihi: string
  yanitlananSoruSayisi: number
  yanitlanmayanSoruSayisi: number
}

export interface AnketCevapDetayDto {
  sorular: AnketSoruCevapDto[]
  yanitlanmayanSoruSayisi: number
}

export interface SoruCevapDisplay {
  soruId: number
  sira: number
  soruMetni: string
  altSoruMetni?: string | null
  yanitlandi: boolean
  cevapMetni: string
  bagliSoru: boolean
  children: SoruCevapDisplay[]
}

export const UNANSWERED_ANSWER_LABEL = 'Yanıtlanmadı'

export interface SurveyResponsesQueryParams {
  baslikId?: number
  /** Seçilen anket adı — API yanıtını istemci tarafında süzmek için (query string'e eklenmez). */
  anketAdi?: string
  menseiId?: number
  bolgeId?: number
  alimNoktasiId?: number
  mintikaId?: number
  koyId?: number
}

export function hasGeoSurveyFilter(params?: SurveyResponsesQueryParams): boolean {
  return Boolean(
    params?.menseiId ||
      params?.bolgeId ||
      params?.alimNoktasiId ||
      params?.mintikaId ||
      params?.koyId,
  )
}

export function hasAnketSurveyFilter(params?: SurveyResponsesQueryParams): boolean {
  return Boolean(params?.baslikId || params?.anketAdi?.trim())
}

export function hasAnySurveyFilter(params?: SurveyResponsesQueryParams): boolean {
  return hasGeoSurveyFilter(params) || hasAnketSurveyFilter(params)
}

export function getAnketCevapRowId(
  ekiciId: string,
  sablonId: number,
  baslikId?: number,
): string {
  if (baslikId != null && baslikId > 0) {
    return `${ekiciId}|${baslikId}|${sablonId}`
  }
  return `${ekiciId}|${sablonId}`
}

export function getOzetFullName(item: Pick<AnketCevapOzetItem, 'ekiciAd' | 'ekiciSoyad'>): string {
  return [item.ekiciAd, item.ekiciSoyad].filter(Boolean).join(' ').trim() || '-'
}

export function getOzetKullaniciAdi(
  item: Pick<AnketCevapOzetItem, 'kullaniciAdi'>,
): string {
  return item.kullaniciAdi?.trim() || '—'
}

export function getOzetSurveyName(
  item: Pick<AnketCevapOzetItem, 'baslikAdi' | 'sablonAdi'>,
): string {
  return item.baslikAdi?.trim() || item.sablonAdi?.trim() || '-'
}

export function getOzetDetayBadge(item: Pick<
  AnketCevapOzetItem,
  'yanitlananSoruSayisi' | 'yanitlanmayanSoruSayisi'
>): string {
  return `${item.yanitlananSoruSayisi} cevaplı - ${item.yanitlanmayanSoruSayisi} cevapsız`
}
