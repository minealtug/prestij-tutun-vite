import type { AnketYanitOturumDto, AnketYanitSoruDto } from '../types/anket-yanit.types'
import { isEkiciProducerQuestion } from './is-ekici-producer-question'
import { getQuestionKey } from './question-key'
import { resolveQuestionInputKind } from './resolve-question-input-kind'

export function getVisibleOturumQuestions(oturum: AnketYanitOturumDto | undefined): AnketYanitSoruDto[] {
  if (!oturum) return []
  return oturum.sorular.filter((soru) => soru.gorunur)
}

export function sortOturumQuestionsForFill(questions: AnketYanitSoruDto[]): AnketYanitSoruDto[] {
  const ekiciQuestions = questions.filter(isEkiciProducerQuestion)
  const otherQuestions = questions.filter((question) => !isEkiciProducerQuestion(question))
  return [...ekiciQuestions, ...otherQuestions]
}

export function getCurrentOturumQuestion(
  oturum: AnketYanitOturumDto | undefined,
): AnketYanitSoruDto | null {
  const visible = sortOturumQuestionsForFill(getVisibleOturumQuestions(oturum))
  return visible.find((soru) => !soru.yanitlandi) ?? null
}

function isQuestionAnswered(question: AnketYanitSoruDto, value: string): boolean {
  const kind = resolveQuestionInputKind(question)

  if (kind === 'checkbox') {
    return question.zorunlu ? value === 'true' : true
  }

  return value.trim().length > 0
}

/** Ekranda görünen sorular ve formdaki cevaplara göre ilerleme. */
export function getFormFillProgress(
  questions: AnketYanitSoruDto[],
  answers: Record<string, string>,
) {
  const total = questions.length
  const answered = questions.filter((question) =>
    isQuestionAnswered(question, answers[getQuestionKey(question)] ?? ''),
  ).length

  return { total, answered }
}

export function getInitialAnswerValue(
  soru: AnketYanitSoruDto,
  sessionEkiciId?: string | null,
): string {
  const kind = resolveQuestionInputKind(soru)

  if (kind === 'ekici') {
    return soru.ekiciId ?? sessionEkiciId ?? ''
  }

  if (kind === 'checkbox') {
    const text = soru.cevapText?.trim().toLocaleLowerCase('tr-TR')
    return text === 'evet' || text === 'true' ? 'true' : 'false'
  }

  if (soru.cevapText) return soru.cevapText
  return ''
}

export function buildInitialAnswersMap(
  questions: AnketYanitSoruDto[],
  sessionEkiciId?: string | null,
): Record<string, string> {
  const answers: Record<string, string> = {}
  for (const question of questions) {
    answers[getQuestionKey(question)] = getInitialAnswerValue(question, sessionEkiciId)
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
