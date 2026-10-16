import type { SurveyFillSoruView } from '../types/anket-yanit.types'

export function listParentIds(
  question: Pick<SurveyFillSoruView, 'bagliKosullar' | 'bagliOlduguSoruId'>,
): number[] {
  const ids: number[] = []
  for (const kosul of question.bagliKosullar ?? []) {
    if (kosul.parentSoruId > 0 && !ids.includes(kosul.parentSoruId)) {
      ids.push(kosul.parentSoruId)
    }
  }

  if (
    question.bagliOlduguSoruId != null &&
    question.bagliOlduguSoruId > 0 &&
    !ids.includes(question.bagliOlduguSoruId)
  ) {
    ids.unshift(question.bagliOlduguSoruId)
  }

  return ids
}

/** Aynı soru en az iki üst soruya bağlıysa her görünümün cevabı ayrı tutulur. */
export function usesSeparateParentAnswers(question: SurveyFillSoruView): boolean {
  return Boolean(question.bagliSoru) && listParentIds(question).length >= 2
}

export function getQuestionKey(question: SurveyFillSoruView) {
  const parentId = question.bagliOlduguSoruId
  if (usesSeparateParentAnswers(question) && parentId != null && parentId > 0) {
    return `yanit-${question.soruId}-parent-${parentId}`
  }
  return `yanit-${question.soruId}`
}

export function getQuestionFieldKey(question: SurveyFillSoruView) {
  return getQuestionKey(question)
}
