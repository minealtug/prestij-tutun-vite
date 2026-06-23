import type { QuestionDto } from '@/features/questions/types/question.types'
import { normalizeBagliKosulTipi } from '@/features/questions/utils/bagli-kosul-tipi'
import type { AnketYanitOturumDto, AnketYanitSoruDto } from '../types/anket-yanit.types'
import type { AnswerTypeKindLookup } from './build-answer-type-kind-lookup'
import { isEkiciProducerQuestion } from './is-ekici-producer-question'
import {
  formatMultiSelectValue,
  isMultiSelectValueAnswered,
} from './multi-select-value'
import { toDateInputValue } from './date-input-value'
import { getQuestionKey } from './question-key'
import { resolveEffectiveQuestionInputKind } from './resolve-question-input-kind'
import { sortQuestionsUnderParents } from './sort-survey-fill-questions'

function readSecenekGrupId(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

function readPositiveId(value: unknown): number | null {
  return readSecenekGrupId(value)
}

function readQuestionSecenekGrupId(question: QuestionDto): number | null {
  const raw = question as QuestionDto & { SecenekGrupId?: number | null }
  return readSecenekGrupId(question.secenekGrupId ?? raw.SecenekGrupId)
}

export function mapQuestionDefinitionToOturumPreview(
  question: QuestionDto,
  sira: number,
): AnketYanitSoruDto {
  return {
    soruId: Number(question.id),
    sira,
    soruMetni: question.soruMetni,
    altSoruMetni: question.altSoruMetni,
    gorunur: true,
    zorunlu: question.zorunlu,
    bagliSoru: question.bagliSoru,
    bagliOlduguSoruId: readPositiveId(question.bagliOlduguSoruId) ?? null,
    bagliAltSecenekId: readPositiveId(question.bagliAltSecenekId) ?? null,
    bagliKosulTipi: normalizeBagliKosulTipi(question.bagliKosulTipi),
    cevapGirdiTipAdi: question.cevapGirdiTipAdi ?? null,
    cevapGirdiTipId: question.cevapGirdiTipId ?? null,
    secenekGrupId: readQuestionSecenekGrupId(question),
    altSecenekler: [],
    yanitlandi: false,
    cevapText: null,
    cevapAltSecenekId: null,
    cevapAltSecenekIds: [],
    ekiciId: null,
  }
}

export function buildPreviewQuestionsFromDefinitions(
  definitions: QuestionDto[] | undefined,
): AnketYanitSoruDto[] {
  if (!definitions?.length) return []

  return sortOturumQuestionsForFill(
    definitions
      .filter((question) => question.aktif)
      .map((question, index) => mapQuestionDefinitionToOturumPreview(question, index + 1))
      .filter((question) => !isEkiciProducerQuestion(question)),
  )
}

/** Oturumdaki tüm sorular (bağlı dahil, gorunur=false olanlar da). */
export function getAllOturumQuestions(oturum: AnketYanitOturumDto | undefined): AnketYanitSoruDto[] {
  if (!oturum) return []
  return oturum.sorular
}

export function getVisibleOturumQuestions(oturum: AnketYanitOturumDto | undefined): AnketYanitSoruDto[] {
  if (!oturum) return []
  return oturum.sorular.filter((soru) => soru.gorunur)
}

/** Doldurma ekranı: önce görünür sorular; hiçbiri yoksa oturumdaki tüm sorular. */
export function getFillOturumQuestions(oturum: AnketYanitOturumDto | undefined): AnketYanitSoruDto[] {
  if (!oturum) return []
  const visible = getVisibleOturumQuestions(oturum)
  if (visible.length > 0) return visible
  return oturum.sorular
}

export function getDisplayFillQuestions(questions: AnketYanitSoruDto[]): AnketYanitSoruDto[] {
  return sortOturumQuestionsForFill(questions).filter(
    (question) => !isEkiciProducerQuestion(question),
  )
}

export function sortOturumQuestionsForFill(questions: AnketYanitSoruDto[]): AnketYanitSoruDto[] {
  const ekiciQuestions = questions.filter(isEkiciProducerQuestion)
  const otherQuestions = questions.filter((question) => !isEkiciProducerQuestion(question))
  return [...ekiciQuestions, ...sortQuestionsUnderParents(otherQuestions)]
}

export function getCurrentOturumQuestion(
  oturum: AnketYanitOturumDto | undefined,
): AnketYanitSoruDto | null {
  const visible = sortOturumQuestionsForFill(getVisibleOturumQuestions(oturum))
  return visible.find((soru) => !soru.yanitlandi) ?? null
}

function isQuestionAnswered(
  question: AnketYanitSoruDto,
  value: string,
  answerTypeLookup?: AnswerTypeKindLookup,
  useManualEntry = false,
): boolean {
  const kind = resolveEffectiveQuestionInputKind(question, answerTypeLookup, useManualEntry)

  if (kind === 'checkbox') {
    return value === 'true'
  }

  if (kind === 'multiSelect') {
    return isMultiSelectValueAnswered(value)
  }

  if (kind === 'select') {
    const optionId = Number(value)
    return Number.isFinite(optionId) && optionId > 0
  }

  if (kind === 'ekici') {
    return value.trim().length > 0
  }

  return value.trim().length > 0
}

function hasPersistedAnswer(question: AnketYanitSoruDto): boolean {
  if (!question.yanitlandi) return false
  return (
    (question.cevapAltSecenekIds?.length ?? 0) > 0 ||
    question.cevapAltSecenekId != null ||
    Boolean(question.cevapText?.trim()) ||
    Boolean(question.ekiciId?.trim())
  )
}

/** Ekranda görünen sorular ve formdaki cevaplara göre ilerleme. */
export function getFormFillProgress(
  questions: AnketYanitSoruDto[],
  answers: Record<string, string>,
  answerTypeLookup?: AnswerTypeKindLookup,
  manualEntryByKey: Record<string, boolean> = {},
) {
  const total = questions.length
  const answered = questions.filter((question) => {
    const key = getQuestionKey(question)
    const value = answers[key] ?? ''
    return (
      isQuestionAnswered(
        question,
        value,
        answerTypeLookup,
        manualEntryByKey[key] ?? false,
      ) || hasPersistedAnswer(question)
    )
  }).length

  return { total, answered }
}

export function getInitialAnswerValue(
  soru: AnketYanitSoruDto,
  sessionEkiciId?: string | null,
  answerTypeLookup?: AnswerTypeKindLookup,
): string {
  const kind = resolveEffectiveQuestionInputKind(soru, answerTypeLookup, false)

  if (kind === 'ekici') {
    return soru.ekiciId ?? sessionEkiciId ?? ''
  }

  if (kind === 'checkbox') {
    const text = soru.cevapText?.trim().toLocaleLowerCase('tr-TR')
    return text === 'evet' || text === 'true' ? 'true' : 'false'
  }

  if (kind === 'multiSelect') {
    if ((soru.cevapAltSecenekIds?.length ?? 0) > 0) {
      return formatMultiSelectValue(soru.cevapAltSecenekIds!)
    }
    if (soru.cevapAltSecenekId != null) return String(soru.cevapAltSecenekId)
    return ''
  }

  if (kind === 'select') {
    if (soru.cevapAltSecenekId != null) return String(soru.cevapAltSecenekId)
    const matched = soru.altSecenekler?.find(
      (option) => option.adi === soru.cevapText?.trim(),
    )
    return matched ? String(matched.id) : ''
  }

  if (kind === 'date') {
    return toDateInputValue(soru.cevapText)
  }

  if (soru.cevapText) return soru.cevapText

  if (soru.cevapAltSecenekId != null) return String(soru.cevapAltSecenekId)

  return ''
}

export function buildInitialAnswersMap(
  questions: AnketYanitSoruDto[],
  sessionEkiciId?: string | null,
  answerTypeLookup?: AnswerTypeKindLookup,
): Record<string, string> {
  const answers: Record<string, string> = {}
  for (const question of questions) {
    answers[getQuestionKey(question)] = getInitialAnswerValue(
      question,
      sessionEkiciId,
      answerTypeLookup,
    )
  }
  return answers
}

export function getQuestionDisplayNumber(
  questions: AnketYanitSoruDto[],
  question: AnketYanitSoruDto,
): number | undefined {
  if (isEkiciProducerQuestion(question)) return undefined

  const numberedBefore = questions
    .slice(0, questions.findIndex((item) => item.soruId === question.soruId))
    .filter((item) => !isEkiciProducerQuestion(item)).length

  return numberedBefore + 1
}

export function getQuestionsToSubmit(
  questions: AnketYanitSoruDto[],
  answers: Record<string, string>,
  initialAnswers: Record<string, string>,
): AnketYanitSoruDto[] {
  return questions.filter((question) => {
    const key = getQuestionKey(question)
    const value = answers[key] ?? ''
    const initial = initialAnswers[key] ?? ''

    if (!value.trim() && !question.zorunlu) return false
    if (question.yanitlandi && value === initial) return false

    return true
  })
}

export function getDraftQuestionsToSubmit(
  questions: AnketYanitSoruDto[],
  answers: Record<string, string>,
  initialAnswers: Record<string, string>,
  answerTypeLookup?: AnswerTypeKindLookup,
  manualEntryByKey: Record<string, boolean> = {},
): AnketYanitSoruDto[] {
  return questions.filter((question) => {
    const key = getQuestionKey(question)
    const value = answers[key] ?? ''
    const initial = initialAnswers[key] ?? ''
    const manual = manualEntryByKey[key] ?? false

    if (!isQuestionAnswered(question, value, answerTypeLookup, manual)) return false
    if (value === initial) return false

    return true
  })
}
