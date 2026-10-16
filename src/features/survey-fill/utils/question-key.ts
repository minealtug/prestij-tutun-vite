import type { SurveyFillSoruView } from '../types/anket-yanit.types'

export function getQuestionKey(question: SurveyFillSoruView) {
  return `yanit-${question.soruId}`
}

/** Aynı soru birden fazla parent altında göründüğünde React ve DOM kimliği. Cevap anahtarı değişmez. */
export function getQuestionFieldKey(question: SurveyFillSoruView) {
  const base = getQuestionKey(question)
  if (question.bagliSoru && question.bagliOlduguSoruId != null && question.bagliOlduguSoruId > 0) {
    return `${base}-parent-${question.bagliOlduguSoruId}`
  }
  return base
}
