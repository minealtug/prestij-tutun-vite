import type { QuestionDto } from '@/features/questions/types/question.types'
import { isAppError, normalizeApiError } from '@/lib/api/api-error'

export const SURVEY_DELETE_BLOCKED_BY_QUESTIONS_MESSAGE =
  'Ankete bağlı soru olduğu için bu anketi silemezsiniz.'

export function surveyHasLinkedQuestions(
  surveyId: string,
  questions: QuestionDto[],
): boolean {
  const baslikId = Number(surveyId)
  if (!Number.isFinite(baslikId) || baslikId <= 0) return false
  return questions.some((question) => question.baslikId === baslikId)
}

function hasSurveyLinkedQuestionsPattern(text: string): boolean {
  return (
    /(anket|baslik|başlık).*(soru|question).*(var|exist|bulun|kayit|kayıt|silinemez|siline)/i.test(
      text,
    ) ||
    /(soru|question).*(var|exist|bulun).*(anket|baslik|başlık|silinemez|siline)/i.test(text) ||
    /(bagli|bağlı|linked).*(soru|question)/i.test(text) ||
    /(foreign|constraint|referans|bağımlı|bagimli)/i.test(text)
  )
}

export function isSurveyDeleteBlockedByQuestions(error: unknown): boolean {
  const normalized = isAppError(error) ? error : normalizeApiError(error)
  const parts = [normalized.message]

  if (normalized.fieldErrors) {
    for (const messages of Object.values(normalized.fieldErrors)) {
      parts.push(...messages)
    }
  }

  const text = parts.join(' ').toLowerCase()
  if (hasSurveyLinkedQuestionsPattern(text)) return true

  if (normalized.status === 409 && /(soru|question)/i.test(text)) return true

  return false
}
