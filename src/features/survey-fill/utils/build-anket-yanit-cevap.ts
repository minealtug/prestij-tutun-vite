import type { AnketYanitCevapRequest, AnketYanitSoruDto } from '../types/anket-yanit.types'
import type { AnswerTypeKindLookup } from './build-answer-type-kind-lookup'
import { parseMultiSelectValue } from './multi-select-value'
import { toDateOnlyApiValue } from './date-input-value'
import { resolveEffectiveQuestionInputKind } from './resolve-question-input-kind'

export function buildAnketYanitCevapRequest(
  baslikId: number,
  sablonId: number,
  sessionEkiciId: string,
  mintikaId: number,
  soru: AnketYanitSoruDto,
  value: string,
  answerTypeLookup?: AnswerTypeKindLookup,
  useManualEntry = false,
): AnketYanitCevapRequest {
  const kind = resolveEffectiveQuestionInputKind(soru, answerTypeLookup, useManualEntry)
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

  if (kind === 'multiSelect') {
    const optionIds = parseMultiSelectValue(value)
    if (optionIds.length > 0) {
      return {
        ...base,
        cevapAltSecenekIds: optionIds,
        cevapAltSecenekId: optionIds[0],
        cevapText: null,
      }
    }
    return { ...base, cevapAltSecenekIds: [], cevapText: null }
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

  if (kind === 'date') {
    const dateValue = toDateOnlyApiValue(value)
    return { ...base, cevapDatetime: dateValue, cevapText: dateValue }
  }

  return { ...base, cevapText: value.trim() || null }
}
