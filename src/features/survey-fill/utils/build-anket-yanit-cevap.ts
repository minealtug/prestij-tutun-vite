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
  const birimId =
    soru.anketCevapBirimId != null && soru.anketCevapBirimId > 0 ? soru.anketCevapBirimId : null
  const withBirim = (payload: AnketYanitCevapRequest): AnketYanitCevapRequest =>
    birimId != null ? { ...payload, birimId } : payload

  const base: AnketYanitCevapRequest = {
    baslikId,
    sablonId,
    soruId: soru.soruId,
    ekiciId: sessionEkiciId,
    mintikaId,
  }

  if (kind === 'ekici') {
    return withBirim({ ...base, ekiciId: value || sessionEkiciId, cevapText: null })
  }

  if (kind === 'select') {
    const optionId = Number(value)
    if (Number.isFinite(optionId) && optionId > 0) {
      return withBirim({ ...base, cevapAltSecenekId: optionId, cevapText: null })
    }
    return withBirim({ ...base, cevapText: value.trim() || null })
  }

  if (kind === 'multiSelect') {
    const optionIds = parseMultiSelectValue(value)
    if (optionIds.length > 0) {
      return withBirim({
        ...base,
        cevapAltSecenekIds: optionIds,
        cevapAltSecenekId: optionIds[0],
        cevapText: null,
      })
    }
    return withBirim({ ...base, cevapAltSecenekIds: [], cevapText: null })
  }

  if (kind === 'checkbox') {
    return withBirim({ ...base, cevapText: value === 'true' ? 'Evet' : 'Hayır' })
  }

  if (kind === 'number') {
    const trimmed = value.trim()
    if (!trimmed) {
      return withBirim({ ...base, cevapNumeric: null, cevapText: null })
    }
    const numeric = Number(trimmed)
    return Number.isFinite(numeric)
      ? withBirim({ ...base, cevapNumeric: numeric, cevapText: trimmed })
      : withBirim({ ...base, cevapText: trimmed })
  }

  if (kind === 'date') {
    const dateValue = toDateOnlyApiValue(value)
    return withBirim({ ...base, cevapDatetime: dateValue, cevapText: dateValue })
  }

  return withBirim({ ...base, cevapText: value.trim() || null })
}
