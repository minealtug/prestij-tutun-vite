import type { CevapGirdiTipDto, QuestionDto } from '@/features/questions/types/question.types'
import type { AltSecenekOptionDto, AnketYanitSoruDto } from '../types/anket-yanit.types'
import { getAnswerTypeAdiById } from './build-answer-type-kind-lookup'

function readPositiveId(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

export function enrichOturumQuestionsWithDefinitions(
  questions: AnketYanitSoruDto[],
  definitions: QuestionDto[] | undefined,
  answerInputTypes?: CevapGirdiTipDto[],
): AnketYanitSoruDto[] {
  if (!definitions?.length && !answerInputTypes?.length) return questions

  const byId = new Map((definitions ?? []).map((question) => [Number(question.id), question]))

  return questions.map((soru) => {
    const definition = byId.get(soru.soruId)
    const cevapGirdiTipId = soru.cevapGirdiTipId ?? definition?.cevapGirdiTipId ?? null
    const cevapGirdiTipAdi =
      soru.cevapGirdiTipAdi ??
      definition?.cevapGirdiTipAdi ??
      getAnswerTypeAdiById(answerInputTypes, cevapGirdiTipId)

    if (!definition && !cevapGirdiTipAdi && cevapGirdiTipId == null) return soru

    return {
      ...soru,
      cevapGirdiTipAdi,
      cevapGirdiTipId,
      secenekGrupId: soru.secenekGrupId ?? readPositiveId(definition?.secenekGrupId),
    }
  })
}

export function mergeAltSeceneklerIntoQuestions(
  questions: AnketYanitSoruDto[],
  optionsByGrupId: Record<number, AltSecenekOptionDto[]>,
): AnketYanitSoruDto[] {
  return questions.map((soru) => {
    const fromGrup =
      soru.secenekGrupId != null ? optionsByGrupId[soru.secenekGrupId] ?? [] : []
    const altSecenekler =
      soru.altSecenekler.length > 0
        ? soru.altSecenekler
        : fromGrup

    return altSecenekler === soru.altSecenekler ? soru : { ...soru, altSecenekler }
  })
}
