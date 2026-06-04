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

export interface AnketCevapDegerDto {
  id: string
  soruId: number
  soruMetni: string
  ekiciId: string
  ekiciAd: string
  ekiciSoyad: string
  sablonId: number
  sablonAdi: string
  mintikaId: number
  mintikaAdi: string
  kullaniciId: number
  islemTarihi: string
  cevapAltSecenekId: number | null
  cevapAltSecenekAdi: string | null
  cevapText: string | null
  cevapNumeric: number | null
  cevapDatetime: string | null
  birimId: number | null
  kaynak: string | null
}

export interface AnketSoruCevapDto {
  sira: number
  soruId: number
  soruMetni: string
  altSoruMetni?: string | null
  zorunlu?: boolean
  bagliSoru?: boolean
  yanitlandi: boolean
  cevap?: AnketCevapDegerDto | null
}

export interface YanitlanmayanSoruDto {
  id: number
  baslikId: number
  baslikAdi?: string | null
  cevapGirdiTipAdi?: string | null
  soruMetni: string
  altSoruMetni?: string | null
  zorunlu?: boolean
  aktif?: boolean
  secenekGrupId?: number | null
  bagliSoru?: boolean
  bagliOlduguSoruId?: number | null
  bagliOlduguSoru?: string | YanitlanmayanSoruDto | null
  kaynak?: string | null
}

export interface AnketCevapGrupDto {
  ekiciId: string
  ekiciAd: string
  ekiciSoyad: string
  mintikaId: number
  mintikaAdi: string
  sablonId: number
  sablonAdi: string
  baslikId: number
  baslikAdi: string
  sonIslemTarihi: string
  yanitlananSoruSayisi: number
  yanitlanmayanSoruSayisi: number
  sorular: AnketSoruCevapDto[]
  yanitlananSorular: AnketCevapDegerDto[]
  yanitlanmayanSorular: YanitlanmayanSoruDto[]
}

export interface ResponseAnswerDetail {
  questionNo: number
  soruId: number
  questionText: string
  altSoruMetni?: string | null
  answer: string
  isUnanswered?: boolean
  bagliSoru?: boolean
  bagliOlduguSoruId?: number | null
  bagliOlduguSoruText?: string | null
  zorunlu?: boolean
}

export interface SurveyResponseGroup {
  id: string
  ekiciId: string
  baslikId: number
  submittedAt: string
  fullName: string
  surveyName: string
  mintikaAdi: string
  yanitlananSoruSayisi: number
  yanitlanmayanSoruSayisi: number
  answers: ResponseAnswerDetail[]
}

export const UNANSWERED_ANSWER_LABEL = 'Yanıtlanmadı'

export interface SurveyResponsesQueryParams {
  menseiId?: number
  bolgeId?: number
  alimNoktasiId?: number
  mintikaId?: number
  koyId?: number
}

export function hasAnySurveyFilter(params?: SurveyResponsesQueryParams): boolean {
  return Boolean(
    params?.menseiId ||
      params?.bolgeId ||
      params?.alimNoktasiId ||
      params?.mintikaId ||
      params?.koyId,
  )
}
