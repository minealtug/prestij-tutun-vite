export interface AnketSablonDto {
  id: number
  adi: string
  baslikId?: number | null
}

export interface AltSecenekOptionDto {
  id: number
  adi: string
  siraNo?: number | null
}

export interface AnketYanitSoruDto {
  soruId: number
  sira: number
  soruMetni: string
  altSoruMetni: string | null
  gorunur: boolean
  zorunlu: boolean
  bagliSoru: boolean
  bagliOlduguSoruId?: number | null
  bagliAltSecenekId?: number | null
  bagliKosulTipi?: string | null
  cevapGirdiTipAdi: string | null
  cevapGirdiTipId: number | null
  secenekGrupId: number | null
  altSecenekler: AltSecenekOptionDto[]
  anketCevapBirimId?: number | null
  anketCevapBirimAdi?: string | null
  yanitlandi: boolean
  cevapText: string | null
  cevapAltSecenekId: number | null
  cevapAltSecenekIds?: number[]
  ekiciId: string | null
}

export interface AnketYanitOturumDto {
  ekiciId: string | null
  mintikaId: number | null
  baslikId?: number | null
  baslikAdi?: string | null
  sablonAdi?: string | null
  yanitlananSoruSayisi?: number
  yanitlanmayanSoruSayisi?: number
  toplamGorunurSoruSayisi?: number
  tamamlanabilir: boolean
  sorular: AnketYanitSoruDto[]
}

export interface AnketYanitOturumParams {
  baslikId: number
  sablonId: number
  ekiciId: string
}

export interface AnketYanitCevapRequest {
  baslikId: number
  sablonId: number
  soruId: number
  ekiciId: string
  mintikaId: number
  cevapText?: string | null
  cevapNumeric?: number | null
  cevapDatetime?: string | null
  cevapAltSecenekId?: number | null
  cevapAltSecenekIds?: number[] | null
  birimId?: number | null
}

export interface AnketYanitCevapBatchRequest {
  baslikId: number
  sablonId: number
  ekiciId: string
  mintikaId: number
  cevaplar: AnketYanitCevapBatchItem[]
}

export interface AnketYanitCevapBatchItem {
  soruId: number
  cevapText?: string | null
  cevapNumeric?: number | null
  cevapDatetime?: string | null
  cevapAltSecenekId?: number | null
  cevapAltSecenekIds?: number[] | null
  birimId?: number | null
}

export interface AnketYanitCevapBatchResponse {
  savedCount: number
  tamamlanabilir?: unknown
}

/** Soru alanı bileşenlerinde kullanılan ortak görünüm modeli. */
export interface SurveyFillSoruView {
  soruId: number
  soruMetni: string
  altSoruMetni?: string | null
  zorunlu: boolean
  bagliSoru?: boolean
  bagliOlduguSoruId?: number | null
  bagliAltSecenekId?: number | null
  bagliKosulTipi?: string | null
  cevapGirdiTipAdi?: string | null
  cevapGirdiTipId?: number | null
  secenekGrupId?: number | null
  altSecenekler?: AltSecenekOptionDto[]
  anketCevapBirimId?: number | null
  anketCevapBirimAdi?: string | null
  sira?: number | null
}
