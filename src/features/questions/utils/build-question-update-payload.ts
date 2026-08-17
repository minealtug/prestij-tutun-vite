import type { QuestionDto } from '../types/question.types'
import { resolveCevapGirdiTipId } from './resolve-question-cevap-girdi-tip'
import { resolveQuestionBirimId } from './resolve-question-birim-adi'

export function buildQuestionUpdatePayload(
  question: QuestionDto,
  values?: {
    soruMetni?: string
    aktif?: boolean
    zorunlu?: boolean
    anketCevapBirimId?: string
    altSecenekIds?: number[]
  },
): Record<string, unknown> | null {
  const cevapGirdiTipId = resolveCevapGirdiTipId(question)
  if (cevapGirdiTipId == null) return null

  const birimId =
    values?.anketCevapBirimId !== undefined
      ? Number(values.anketCevapBirimId)
      : resolveQuestionBirimId(question)

  const payload: Record<string, unknown> = {
    soruMetni: values?.soruMetni ?? question.soruMetni,
    aktif: values?.aktif ?? question.aktif,
    zorunlu: values?.zorunlu ?? question.zorunlu,
    cevapGirdiTipId,
    bagliSoru: question.bagliSoru,
  }

  if (question.kaynak === 'AppDb') {
    payload.baslikId = question.baslikId
  }

  const altSoruMetni = question.altSoruMetni?.trim()
  if (altSoruMetni) payload.altSoruMetni = altSoruMetni

  if (question.secenekGrupId != null && question.secenekGrupId > 0) {
    payload.secenekGrupId = question.secenekGrupId
    if (question.kaynak === 'AppDb') {
      payload.altSecenekIds = values?.altSecenekIds ?? question.altSecenekIds ?? []
    }
  }

  if (Number.isFinite(birimId) && (birimId as number) > 0) {
    payload.anketCevapBirimId = birimId
  }

  return payload
}
