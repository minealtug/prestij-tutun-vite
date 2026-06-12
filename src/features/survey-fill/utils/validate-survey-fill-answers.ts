import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import type { AnswerTypeKindLookup } from './build-answer-type-kind-lookup'
import { resolveQuestionInputKind } from './resolve-question-input-kind'
import { getQuestionKey } from './question-key'

export function validateSurveyFillAnswer(
  question: SurveyFillSoruView,
  value: string,
  answerTypeLookup?: AnswerTypeKindLookup,
): string | undefined {
  if (!question.zorunlu) return undefined

  const kind = resolveQuestionInputKind(question, answerTypeLookup)

  if (kind === 'checkbox') {
    return value === 'true' ? undefined : 'Bu soru zorunludur.'
  }

  if (kind === 'ekici') {
    return value ? undefined : 'Lütfen bir ekici seçin.'
  }

  if (kind === 'select') {
    const optionId = Number(value)
    if (Number.isFinite(optionId) && optionId > 0) return undefined
    if (!question.zorunlu) return undefined
    if (!question.secenekGrupId && (question.altSecenekler?.length ?? 0) === 0) {
      return 'Bu soru için seçenek grubu tanımlı değil.'
    }
    return 'Lütfen bir seçenek seçin.'
  }

  return value.trim() ? undefined : 'Bu alan zorunludur.'
}

export function validateSurveyFillAnswers(
  questions: SurveyFillSoruView[],
  answers: Record<string, string>,
  answerTypeLookup?: AnswerTypeKindLookup,
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const question of questions) {
    const key = getQuestionKey(question)
    const error = validateSurveyFillAnswer(question, answers[key] ?? '', answerTypeLookup)
    if (error) errors[key] = error
  }

  return errors
}
