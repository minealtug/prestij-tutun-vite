import type { SurveyFillSoruView } from '../types/anket-yanit.types'

export function getQuestionKey(question: SurveyFillSoruView) {
  return `yanit-${question.soruId}`
}
