import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import { resolveQuestionInputKind } from './resolve-question-input-kind'
import { getQuestionKey } from './question-key'

export function validateSurveyFillAnswer(
  question: SurveyFillSoruView,
  value: string,
): string | undefined {
  if (!question.zorunlu) return undefined

  const kind = resolveQuestionInputKind(question)

  if (kind === 'checkbox') {
    return value === 'true' ? undefined : 'Bu soru zorunludur.'
  }

  if (kind === 'ekici') {
    return value ? undefined : 'Lütfen bir ekici seçin.'
  }

  return value.trim() ? undefined : 'Bu alan zorunludur.'
}

export function validateSurveyFillAnswers(
  questions: SurveyFillSoruView[],
  answers: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const question of questions) {
    const key = getQuestionKey(question)
    const error = validateSurveyFillAnswer(question, answers[key] ?? '')
    if (error) errors[key] = error
  }

  return errors
}
