import { isBuyukEsitKosul } from '@/features/questions/utils/bagli-kosul-tipi'
import type { AnketYanitSoruDto } from '../types/anket-yanit.types'
import { getEffectiveBagliKosullar } from './bagli-kosullar'
import type { AnswerTypeKindLookup } from './build-answer-type-kind-lookup'
import { isBagliKosulMatchedForAny } from './evaluate-bagli-kosul'
import { getQuestionKey } from './question-key'
import { parseMultiSelectValue } from './multi-select-value'
import { resolveEffectiveQuestionInputKind } from './resolve-question-input-kind'
import { sortQuestionsUnderParents } from './sort-survey-fill-questions'

function isFormValueAnswered(
  question: AnketYanitSoruDto,
  value: string,
  answerTypeLookup?: AnswerTypeKindLookup,
  useManualEntry = false,
): boolean {
  const kind = resolveEffectiveQuestionInputKind(question, answerTypeLookup, useManualEntry)

  if (kind === 'checkbox') return value === 'true'
  if (kind === 'multiSelect') return parseMultiSelectValue(value).length > 0
  if (kind === 'select') {
    const optionId = Number(value)
    return Number.isFinite(optionId) && optionId > 0
  }
  if (kind === 'ekici') return value.trim().length > 0

  return value.trim().length > 0
}

function readFormCevapAltSecenekIds(
  question: AnketYanitSoruDto,
  value: string,
  answerTypeLookup?: AnswerTypeKindLookup,
  useManualEntry = false,
): number[] {
  const kind = resolveEffectiveQuestionInputKind(question, answerTypeLookup, useManualEntry)

  if (kind === 'multiSelect') {
    return parseMultiSelectValue(value)
  }

  if (kind !== 'select' || useManualEntry) return []

  const optionId = Number(value)
  return Number.isFinite(optionId) && optionId > 0 ? [optionId] : []
}

function readParentCevapAltSecenekIds(
  parent: AnketYanitSoruDto,
  answers: Record<string, string>,
  answerTypeLookup?: AnswerTypeKindLookup,
  manualEntryByKey: Record<string, boolean> = {},
): number[] | undefined {
  const parentKey = getQuestionKey(parent)
  const parentValue = answers[parentKey] ?? ''
  const parentManual = manualEntryByKey[parentKey] ?? false

  if (isFormValueAnswered(parent, parentValue, answerTypeLookup, parentManual)) {
    return readFormCevapAltSecenekIds(parent, parentValue, answerTypeLookup, parentManual)
  }

  if (!parent.yanitlandi) return undefined

  if ((parent.cevapAltSecenekIds?.length ?? 0) > 0) {
    return parent.cevapAltSecenekIds!
  }

  if (parent.cevapAltSecenekId != null && parent.cevapAltSecenekId > 0) {
    return [parent.cevapAltSecenekId]
  }

  return []
}

function isParentAnswered(
  parent: AnketYanitSoruDto,
  answers: Record<string, string>,
  answerTypeLookup?: AnswerTypeKindLookup,
  manualEntryByKey: Record<string, boolean> = {},
): boolean {
  const parentKey = getQuestionKey(parent)
  const parentValue = answers[parentKey] ?? ''
  const parentManual = manualEntryByKey[parentKey] ?? false

  if (isFormValueAnswered(parent, parentValue, answerTypeLookup, parentManual)) {
    return true
  }

  if (!parent.yanitlandi) return false

  return (
    (parent.cevapAltSecenekIds?.length ?? 0) > 0 ||
    parent.cevapAltSecenekId != null ||
    Boolean(parent.cevapText?.trim()) ||
    Boolean(parent.ekiciId?.trim())
  )
}

function isBagliKosulSatisfied(
  kosul: { parentSoruId: number; bagliAltSecenekId: number | null; bagliKosulTipi: string | null },
  parent: AnketYanitSoruDto,
  allQuestions: AnketYanitSoruDto[],
  answers: Record<string, string>,
  answerTypeLookup: AnswerTypeKindLookup | undefined,
  manualEntryByKey: Record<string, boolean>,
  questionsById: Map<number, AnketYanitSoruDto>,
  visiting: Set<number>,
): boolean {
  if (
    parent.bagliSoru &&
    !isLinkedQuestionVisible(
      parent,
      allQuestions,
      answers,
      answerTypeLookup,
      manualEntryByKey,
      questionsById,
      visiting,
    )
  ) {
    return false
  }

  if (!isParentAnswered(parent, answers, answerTypeLookup, manualEntryByKey)) {
    return false
  }

  if (kosul.bagliAltSecenekId == null || kosul.bagliAltSecenekId <= 0) {
    return true
  }

  const parentAltSecenekIds = readParentCevapAltSecenekIds(
    parent,
    answers,
    answerTypeLookup,
    manualEntryByKey,
  )

  if (parentAltSecenekIds === undefined) return false

  if (
    isBagliKosulMatchedForAny(
      parentAltSecenekIds,
      kosul.bagliAltSecenekId,
      kosul.bagliKosulTipi,
      parent.altSecenekler ?? [],
    )
  ) {
    return true
  }

  if (isBuyukEsitKosul(kosul.bagliKosulTipi)) return false

  return selectedOptionLabelsMatchTrigger(
    parent,
    parentAltSecenekIds,
    findOptionLabel(allQuestions, kosul.bagliAltSecenekId),
  )
}

function findOptionLabel(questions: AnketYanitSoruDto[], optionId: number | null): string | null {
  if (optionId == null || optionId <= 0) return null

  for (const question of questions) {
    const label = question.altSecenekler?.find((option) => option.id === optionId)?.adi?.trim()
    if (label) return label
  }

  return null
}

function selectedOptionLabelsMatchTrigger(
  parent: AnketYanitSoruDto,
  selectedIds: number[],
  triggerLabel: string | null,
): boolean {
  const expected = triggerLabel?.trim().toLocaleLowerCase('tr-TR')
  if (!expected) return false

  return selectedIds.some((id) => {
    const label = parent.altSecenekler?.find((option) => option.id === id)?.adi?.trim()
    return label?.toLocaleLowerCase('tr-TR') === expected
  })
}

export function isLinkedQuestionVisible(
  question: AnketYanitSoruDto,
  allQuestions: AnketYanitSoruDto[],
  answers: Record<string, string>,
  answerTypeLookup?: AnswerTypeKindLookup,
  manualEntryByKey: Record<string, boolean> = {},
  questionsById = new Map(allQuestions.map((item) => [item.soruId, item])),
  visiting = new Set<number>(),
): boolean {
  if (!question.bagliSoru) return true
  if (visiting.has(question.soruId)) return false

  const kosullar = getEffectiveBagliKosullar(question)
  if (kosullar.length === 0) return false

  visiting.add(question.soruId)

  const matched = kosullar.some((kosul) => {
    const parent = questionsById.get(kosul.parentSoruId)
    if (!parent) return false
    return isBagliKosulSatisfied(
      kosul,
      parent,
      allQuestions,
      answers,
      answerTypeLookup,
      manualEntryByKey,
      questionsById,
      visiting,
    )
  })

  visiting.delete(question.soruId)
  return matched
}

export function resolveMatchingParentIds(
  question: AnketYanitSoruDto,
  allQuestions: AnketYanitSoruDto[],
  answers: Record<string, string>,
  answerTypeLookup?: AnswerTypeKindLookup,
  manualEntryByKey: Record<string, boolean> = {},
  questionsById = new Map(allQuestions.map((item) => [item.soruId, item])),
): number[] {
  if (!question.bagliSoru) return []

  const kosullar = getEffectiveBagliKosullar(question)
  const visiting = new Set<number>([question.soruId])
  const parentIds: number[] = []
  const seen = new Set<number>()

  for (const kosul of kosullar) {
    if (seen.has(kosul.parentSoruId)) continue
    const parent = questionsById.get(kosul.parentSoruId)
    if (!parent) continue
    if (
      !isBagliKosulSatisfied(
        kosul,
        parent,
        allQuestions,
        answers,
        answerTypeLookup,
        manualEntryByKey,
        questionsById,
        visiting,
      )
    ) {
      continue
    }

    seen.add(kosul.parentSoruId)
    parentIds.push(kosul.parentSoruId)
  }

  return parentIds
}

export function filterVisibleQuestionsForFill(
  questions: AnketYanitSoruDto[],
  answers: Record<string, string>,
  answerTypeLookup?: AnswerTypeKindLookup,
  manualEntryByKey: Record<string, boolean> = {},
): AnketYanitSoruDto[] {
  const questionsById = new Map(questions.map((item) => [item.soruId, item]))

  const visible: AnketYanitSoruDto[] = []

  for (const question of questions) {
    if (!question.bagliSoru) {
      if (
        isLinkedQuestionVisible(
          question,
          questions,
          answers,
          answerTypeLookup,
          manualEntryByKey,
          questionsById,
        )
      ) {
        visible.push(question)
      }
      continue
    }

    const parentIds = resolveMatchingParentIds(
      question,
      questions,
      answers,
      answerTypeLookup,
      manualEntryByKey,
      questionsById,
    )

    for (const parentId of parentIds) {
      visible.push({
        ...question,
        bagliOlduguSoruId: parentId,
      })
    }
  }

  return sortQuestionsUnderParents(visible, (question) => question.bagliOlduguSoruId)
}
