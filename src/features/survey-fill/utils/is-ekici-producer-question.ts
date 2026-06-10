import type { SurveyFillSoruView } from '../types/anket-yanit.types'

function normalizeQuestionText(text: string) {
  return text
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .replace(/[?？]/g, '')
}

export function isEkiciProducerQuestion(question: SurveyFillSoruView) {
  const normalized = normalizeQuestionText(question.soruMetni)
  return normalized.includes('üretimi yapan kişi') && normalized.includes('ad')
}

export function hasEkiciProducerQuestion(questions: SurveyFillSoruView[]) {
  return questions.some(isEkiciProducerQuestion)
}

export const EKICI_PRODUCER_QUESTION_LABEL = 'Ekici bilgisi'

export function getSurveyFillQuestionLabel(question: SurveyFillSoruView) {
  if (isEkiciProducerQuestion(question)) return EKICI_PRODUCER_QUESTION_LABEL
  return question.soruMetni
}
