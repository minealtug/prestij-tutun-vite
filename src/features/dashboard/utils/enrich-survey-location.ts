import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { getOzetFullName } from '@/features/survey-responses/types/survey-response.types'

export interface EkiciLocationLookup {
  menseiAdi?: string | null
  bolgeAdi?: string | null
  mintikaAdi?: string | null
}

export function enrichSurveyWithEkiciLocation(
  item: AnketCevapOzetItem,
  ekiciById: Map<string, EkiciLocationLookup>,
): AnketCevapOzetItem {
  const ekici = ekiciById.get(item.ekiciId)
  if (!ekici) return item

  return {
    ...item,
    mintikaAdi: item.mintikaAdi?.trim() || ekici.mintikaAdi?.trim() || '',
    bolgeAdi: item.bolgeAdi?.trim() || ekici.bolgeAdi?.trim() || undefined,
    menseiAdi: item.menseiAdi?.trim() || ekici.menseiAdi?.trim() || undefined,
  }
}

export function enrichSurveysWithEkiciLocations(
  items: AnketCevapOzetItem[],
  ekiciById: Map<string, EkiciLocationLookup>,
): AnketCevapOzetItem[] {
  if (ekiciById.size === 0) return items
  return items.map((item) => enrichSurveyWithEkiciLocation(item, ekiciById))
}

export type SurveyChartGroupBy = 'ekici' | 'mintika' | 'bolge' | 'mensei'

/** @deprecated Use SurveyChartGroupBy */
export type IncompleteSurveyGroupBy = SurveyChartGroupBy

export const SURVEY_CHART_GROUP_LABELS: Record<SurveyChartGroupBy, string> = {
  ekici: 'Ekici',
  mintika: 'Mıntıka',
  bolge: 'Bölge',
  mensei: 'Menşei',
}

/** @deprecated Use SURVEY_CHART_GROUP_LABELS */
export const INCOMPLETE_SURVEY_GROUP_LABELS = SURVEY_CHART_GROUP_LABELS

export type SurveyChartStatus = 'incomplete' | 'completed'

export const SURVEY_CHART_STATUS_LABELS: Record<SurveyChartStatus, string> = {
  incomplete: 'Tamamlanmayan',
  completed: 'Tamamlanan',
}

export function isIncompleteSurvey(
  item: Pick<AnketCevapOzetItem, 'yanitlanmayanSoruSayisi'>,
): boolean {
  return Math.max(0, item.yanitlanmayanSoruSayisi) > 0
}

export function isCompletedSurvey(
  item: Pick<AnketCevapOzetItem, 'yanitlananSoruSayisi' | 'yanitlanmayanSoruSayisi'>,
): boolean {
  const answered = Math.max(0, item.yanitlananSoruSayisi)
  const unanswered = Math.max(0, item.yanitlanmayanSoruSayisi)
  return unanswered === 0 && answered > 0
}

export function filterSurveysByChartStatus(
  items: AnketCevapOzetItem[],
  status: SurveyChartStatus,
): AnketCevapOzetItem[] {
  return items.filter(status === 'incomplete' ? isIncompleteSurvey : isCompletedSurvey)
}

export function getSurveyGroupLabel(
  item: AnketCevapOzetItem,
  groupBy: SurveyChartGroupBy,
): string {
  switch (groupBy) {
    case 'ekici':
      return getOzetFullName(item)
    case 'mintika':
      return item.mintikaAdi?.trim() || 'Belirtilmemiş'
    case 'bolge':
      return item.bolgeAdi?.trim() || 'Belirtilmemiş'
    case 'mensei':
      return item.menseiAdi?.trim() || 'Belirtilmemiş'
  }
}
