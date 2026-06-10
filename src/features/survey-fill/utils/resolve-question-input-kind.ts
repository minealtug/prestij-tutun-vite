import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import { isEkiciProducerQuestion } from './is-ekici-producer-question'
import { resolveAnswerInputKind, type AnswerInputKind } from './resolve-answer-input-kind'

export type QuestionInputKind = AnswerInputKind | 'ekici'

export function resolveQuestionInputKind(question: SurveyFillSoruView): QuestionInputKind {
  if (isEkiciProducerQuestion(question)) return 'ekici'
  return resolveAnswerInputKind(question.cevapGirdiTipAdi ?? undefined)
}
