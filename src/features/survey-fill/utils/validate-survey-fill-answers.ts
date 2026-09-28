import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import type { AnswerTypeKindLookup } from './build-answer-type-kind-lookup'
import { isMultiSelectValueAnswered } from './multi-select-value'
import { resolveEffectiveQuestionInputKind } from './resolve-question-input-kind'
import { getQuestionKey } from './question-key'

export function isBakmaklaYukumluBireySayisi(question: Pick<SurveyFillSoruView, 'soruMetni'>): boolean {
  const normalized = question.soruMetni.toLocaleLowerCase('tr-TR')
  return (
    normalized.includes('yükümlü') ||
    normalized.includes('yukumlu') ||
    normalized.includes('bakmakla')
  )
}

function parsePositiveCount(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return null
  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : null
}

export function validateSurveyFillAnswer(
  question: SurveyFillSoruView,
  value: string,
  answerTypeLookup?: AnswerTypeKindLookup,
  useManualEntry = false,
): string | undefined {
  const kind = resolveEffectiveQuestionInputKind(question, answerTypeLookup, useManualEntry)

  if (isBakmaklaYukumluBireySayisi(question)) {
    const numeric = parsePositiveCount(value)
    if (numeric == null || numeric < 1) {
      return 'Bakmakla yükümlü olunan birey sayısı en az 1 olmalıdır.'
    }
    return undefined
  }

  if (!question.zorunlu) return undefined

  if (kind === 'checkbox') {
    return value === 'true' ? undefined : 'Bu soru zorunludur.'
  }

  if (kind === 'multiSelect') {
    return isMultiSelectValueAnswered(value) ? undefined : 'En az bir seçenek işaretleyin.'
  }

  if (kind === 'ekici') {
    return value ? undefined : 'Lütfen bir ekici seçin.'
  }

  if (kind === 'select') {
    const optionId = Number(value)
    if (Number.isFinite(optionId) && optionId > 0) return undefined
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
  manualEntryByKey: Record<string, boolean> = {},
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const question of questions) {
    const key = getQuestionKey(question)
    const error = validateSurveyFillAnswer(
      question,
      answers[key] ?? '',
      answerTypeLookup,
      manualEntryByKey[key] ?? false,
    )
    if (error) errors[key] = error
  }

  return errors
}

export function buildRequiredAnswersSubmitError(errorCount: number): string {
  if (errorCount <= 0) return ''
  if (errorCount === 1) {
    return 'Kaydetmeden önce zorunlu soruyu yanıtlayın.'
  }
  return `Kaydetmeden önce ${errorCount} zorunlu soruyu yanıtlayın.`
}
