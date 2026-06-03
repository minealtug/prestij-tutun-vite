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
}

export interface SurveyResponseGroup {
  id: string
  submittedAt: string
  username: string
  fullName: string
  surveyName: string
  mintikaAdi: string
  answers: ResponseAnswerDetail[]
}

export interface SurveyResponsesQueryParams {
  menseiId?: number
  bolgeId?: number
  alimNoktasiId?: number
  mintikaId?: number
  koyId?: number
}

export function hasAllSurveyFilters(params?: SurveyResponsesQueryParams): boolean {
  return Boolean(
    params?.menseiId &&
      params?.bolgeId &&
      params?.alimNoktasiId &&
      params?.mintikaId &&
      params?.koyId,
  )
}
