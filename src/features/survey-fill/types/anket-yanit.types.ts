export interface AnketSablonDto {
  id: number
  adi: string
  baslikId?: number | null
}

export interface AnketYanitSoruDto {
  soruId: number
  sira: number
  soruMetni: string
  altSoruMetni: string | null
  gorunur: boolean
  zorunlu: boolean
  bagliSoru: boolean
  cevapGirdiTipAdi: string | null
  cevapGirdiTipId: number | null
  yanitlandi: boolean
  cevapText: string | null
  ekiciId: string | null
}

export interface AnketYanitOturumDto {
  ekiciId: string | null
  mintikaId: number | null
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
  birimId?: number | null
}

/** Soru alanı bileşenlerinde kullanılan ortak görünüm modeli. */
export interface SurveyFillSoruView {
  soruId: number
  soruMetni: string
  altSoruMetni?: string | null
  zorunlu: boolean
  bagliSoru?: boolean
  cevapGirdiTipAdi?: string | null
}
