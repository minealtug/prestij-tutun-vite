import type { SurveyDto } from '../types/survey.types'

export function normalizeSurveyName(name: string): string {
  return name.trim().toLocaleLowerCase('tr-TR')
}

export function isSurveyNameTaken(name: string, surveys: SurveyDto[]): boolean {
  const normalized = normalizeSurveyName(name)
  if (!normalized) return false
  return surveys.some((survey) => normalizeSurveyName(survey.name) === normalized)
}

export const DUPLICATE_SURVEY_NAME_MESSAGE = 'Bu anket ismi zaten kayıtlı.'
