export interface SurveyFillRecentSave {
  id: string
  baslikId: number
  sablonId: number
  ekiciId: string
  baslikAdi: string
  sablonAdi: string
  ekiciAdi: string
  savedAnswerCount: number
  savedAt: number
}

export function buildRecentSaveId(
  baslikId: number,
  sablonId: number,
  ekiciId: string,
): string {
  return `${baslikId}:${sablonId}:${ekiciId}`
}

export function buildSurveyFillDeepLink(save: Pick<SurveyFillRecentSave, 'baslikId' | 'sablonId' | 'ekiciId'>) {
  const params = new URLSearchParams({
    baslikId: String(save.baslikId),
    sablonId: String(save.sablonId),
    ekiciId: save.ekiciId,
  })
  return `/anket-doldurma?${params.toString()}`
}
