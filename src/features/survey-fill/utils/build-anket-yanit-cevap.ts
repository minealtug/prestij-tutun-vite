import type { AnketYanitCevapRequest, AnketYanitSoruDto } from '../types/anket-yanit.types'
import type { AnswerTypeKindLookup } from './build-answer-type-kind-lookup'
import { resolveQuestionInputKind } from './resolve-question-input-kind'

export function buildAnketYanitCevapRequest(
  baslikId: number,
  sablonId: number,
  sessionEkiciId: string,
  mintikaId: number,
  soru: AnketYanitSoruDto,
  value: string,
  answerTypeLookup?: AnswerTypeKindLookup,
): AnketYanitCevapRequest {
  const kind = resolveQuestionInputKind(soru, answerTypeLookup)
  const base: AnketYanitCevapRequest = {
    baslikId,
    sablonId,
    soruId: soru.soruId,
    ekiciId: sessionEkiciId,
    mintikaId,
  }

  if (kind === 'ekici') {
    return { ...base, ekiciId: value || sessionEkiciId, cevapText: null }
  }

  if (kind === 'select') {
    const optionId = Number(value)
    if (Number.isFinite(optionId) && optionId > 0) {
      return { ...base, cevapAltSecenekId: optionId, cevapText: null }
    }
    return { ...base, cevapText: value.trim() || null }
  }

  if (kind === 'checkbox') {
    return { ...base, cevapText: value === 'true' ? 'Evet' : 'Hayır' }
  }

  if (kind === 'number') {
    const numeric = Number(value)
    return Number.isFinite(numeric)
      ? { ...base, cevapNumeric: numeric, cevapText: value.trim() || null }
      : { ...base, cevapText: value.trim() || null }
  }

  if (kind === 'date' || kind === 'datetime') {
    return { ...base, cevapDatetime: value || null, cevapText: value.trim() || null }
  }

  return { ...base, cevapText: value.trim() || null }
}
