import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import { isEkiciProducerQuestion } from './is-ekici-producer-question'

/** Üretimi yapan kişi sorusu her zaman listenin başında, anket sırasından bağımsız. */
export function sortSurveyFillQuestions<T extends SurveyFillSoruView>(questions: T[]): T[] {
  const ekiciQuestions = questions.filter(isEkiciProducerQuestion)
  const otherQuestions = questions.filter((question) => !isEkiciProducerQuestion(question))
  return [...ekiciQuestions, ...otherQuestions]
}
