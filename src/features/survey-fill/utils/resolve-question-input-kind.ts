import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import type { AnswerTypeKindLookup } from './build-answer-type-kind-lookup'
import { isEkiciProducerQuestion } from './is-ekici-producer-question'
import { resolveAnswerInputKind, type AnswerInputKind } from './resolve-answer-input-kind'

export type QuestionInputKind = AnswerInputKind | 'ekici'

export function resolveQuestionInputKind(
  question: SurveyFillSoruView,
  answerTypeLookup?: AnswerTypeKindLookup,
): QuestionInputKind {
  if (isEkiciProducerQuestion(question)) return 'ekici'

  const tipId = question.cevapGirdiTipId
  if (tipId != null && answerTypeLookup?.has(tipId)) {
    return answerTypeLookup.get(tipId)!
  }

  if (question.cevapGirdiTipAdi?.trim()) {
    return resolveAnswerInputKind(question.cevapGirdiTipAdi)
  }

  return 'text'
}
