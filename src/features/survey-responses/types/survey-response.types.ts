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

export interface AnketCevapDto {
  id: string
  soruId: number
  soruMetni: string
  ekiciId: string
  ekiciAd: string
  ekiciSoyad: string
  sablonId: number
  sablonAdi: string
  baslikId?: number
  menseiId?: number | null
  menseiAdi?: string | null
  bolgeId?: number | null
  bolgeAdi?: string | null
  alimNoktasiId?: number | null
  alimNoktasiAdi?: string | null
  mintikaId: number
  mintikaAdi: string
  koyId?: number | null
  koyAdi?: string | null
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

export interface ResponseAnswerDetail {
  questionNo: number
  questionText: string
  answer: string
  isUnanswered?: boolean
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
  bagliOlduguSoru?: YanitlanmayanSoruDto | null
  kaynak?: string | null
}

export interface YanitlanmayanSorularDto {
  ekiciId: string
  baslikId: number
  baslikAdi?: string | null
  yanitlanmayanSoruSayisi: number
  yanitlanmayanSorular: YanitlanmayanSoruDto[]
}

export interface SurveyResponseGroup {
  id: string
  ekiciId: string
  baslikId: number
  submittedAt: string
  username: string
  fullName: string
  surveyName: string
  mintikaAdi: string
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
