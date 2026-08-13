import type { SurveyFillSoruView } from '../types/anket-yanit.types'
import { isEkiciProducerQuestion } from './is-ekici-producer-question'

/** Anket doldurma sırası: önce sira, yoksa soruId. */
function compareFillQuestions<T extends SurveyFillSoruView>(left: T, right: T): number {
  const leftSira = left.sira != null && left.sira > 0 ? left.sira : Number.MAX_SAFE_INTEGER
  const rightSira = right.sira != null && right.sira > 0 ? right.sira : Number.MAX_SAFE_INTEGER
  if (leftSira !== rightSira) return leftSira - rightSira
  return left.soruId - right.soruId
}

/** Bağlı soruları doğrudan parent'larının altında gösterir. */
export function sortQuestionsUnderParents<T extends SurveyFillSoruView>(questions: T[]): T[] {
  if (questions.length <= 1) return questions

  const visibleIds = new Set(questions.map((question) => question.soruId))
  const childrenByParent = new Map<number, T[]>()

  for (const question of questions) {
    const parentId = question.bagliOlduguSoruId
    if (!question.bagliSoru || parentId == null || parentId <= 0 || !visibleIds.has(parentId)) {
      continue
    }

    const siblings = childrenByParent.get(parentId) ?? []
    siblings.push(question)
    childrenByParent.set(parentId, siblings)
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort(compareFillQuestions)
  }

  const childIds = new Set<number>()
  for (const siblings of childrenByParent.values()) {
    for (const child of siblings) childIds.add(child.soruId)
  }

  const roots = questions.filter((question) => !childIds.has(question.soruId)).sort(compareFillQuestions)

  const result: T[] = []
  const visited = new Set<number>()

  function walk(question: T) {
    if (visited.has(question.soruId)) return
    visited.add(question.soruId)
    result.push(question)

    for (const child of childrenByParent.get(question.soruId) ?? []) {
      walk(child)
    }
  }

  for (const root of roots) walk(root)

  for (const question of questions) {
    if (!visited.has(question.soruId)) walk(question)
  }

  return result
}

/** Üretimi yapan kişi sorusu her zaman listenin başında; diğerleri parent-altı sırasında. */
export function sortSurveyFillQuestions<T extends SurveyFillSoruView>(questions: T[]): T[] {
  const ekiciQuestions = questions.filter(isEkiciProducerQuestion)
  const otherQuestions = questions.filter((question) => !isEkiciProducerQuestion(question))
  return [...ekiciQuestions, ...sortQuestionsUnderParents(otherQuestions)]
}
