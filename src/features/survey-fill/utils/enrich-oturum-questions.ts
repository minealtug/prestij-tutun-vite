import { resolveQuestionBirimAdi } from '@/features/questions/utils/resolve-question-birim-adi'
import type { CevapGirdiTipDto, QuestionDto } from '@/features/questions/types/question.types'
import { normalizeBagliKosulTipi } from '@/features/questions/utils/bagli-kosul-tipi'
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
      sira:
        definition?.sira != null && definition.sira > 0 ? definition.sira : soru.sira,
      zorunlu: Boolean(definition?.zorunlu ?? soru.zorunlu),
      cevapGirdiTipAdi,
      cevapGirdiTipId,
      secenekGrupId:
        soru.secenekGrupId ??
        readPositiveId(definition?.secenekGrupId) ??
        readPositiveId((definition as QuestionDto & { SecenekGrupId?: number | null })?.SecenekGrupId),
      bagliOlduguSoruId:
        soru.bagliOlduguSoruId ??
        readPositiveId(definition?.bagliOlduguSoruId) ??
        readPositiveId(
          (definition as QuestionDto & { BagliOlduguSoruId?: number | null })?.BagliOlduguSoruId,
        ),
      bagliAltSecenekId:
        soru.bagliAltSecenekId ??
        readPositiveId(definition?.bagliAltSecenekId) ??
        readPositiveId(
          (definition as QuestionDto & { BagliAltSecenekId?: number | null })?.BagliAltSecenekId,
        ),
      bagliKosulTipi: normalizeBagliKosulTipi(
        soru.bagliKosulTipi ??
          definition?.bagliKosulTipi ??
          (definition as QuestionDto & { BagliKosulTipi?: string | null })?.BagliKosulTipi,
      ),
      anketCevapBirimId:
        soru.anketCevapBirimId ??
        readPositiveId(definition?.anketCevapBirimId) ??
        readPositiveId(
          (definition as QuestionDto & { AnketCevapBirimId?: number | null })?.AnketCevapBirimId,
        ) ??
        readPositiveId(definition?.anketCevapBirim?.id),
      anketCevapBirimAdi:
        soru.anketCevapBirimAdi?.trim() ||
        (definition ? resolveQuestionBirimAdi(definition, new Map()) : null),
    }
  })
}

export function mergeAltSeceneklerIntoQuestions(
  questions: AnketYanitSoruDto[],
  optionsByGrupId: Record<number, AltSecenekOptionDto[]>,
  altSecenekIdsBySoruId?: Record<number, number[]>,
): AnketYanitSoruDto[] {
  return questions.map((soru) => {
    if (soru.altSecenekler.length > 0) {
      return soru
    }

    const fromGrup =
      soru.secenekGrupId != null ? optionsByGrupId[soru.secenekGrupId] ?? [] : []
    const selectedIds = altSecenekIdsBySoruId?.[soru.soruId]

    if (selectedIds?.length) {
      const byId = new Map(fromGrup.map((item) => [item.id, item]))
      const filtered: AltSecenekOptionDto[] = []

      selectedIds.forEach((id, index) => {
        const item = byId.get(id)
        if (!item) return
        filtered.push({
          id: item.id,
          adi: item.adi,
          siraNo: index + 1,
        })
      })

      if (filtered.length > 0) {
        return { ...soru, altSecenekler: filtered }
      }
    }

    return { ...soru, altSecenekler: fromGrup }
  })
}
