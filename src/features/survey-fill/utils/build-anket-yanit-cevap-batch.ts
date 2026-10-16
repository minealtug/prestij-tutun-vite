import type {
  AnketYanitCevapBatchRequest,
  AnketYanitCevapRequest,
} from '../types/anket-yanit.types'

export function buildAnketYanitCevapBatchRequest(
  payloads: AnketYanitCevapRequest[],
): AnketYanitCevapBatchRequest {
  if (payloads.length === 0) {
    throw new Error('Kaydedilecek cevap bulunamadi.')
  }

  const first = payloads[0]

  return {
    baslikId: first.baslikId,
    sablonId: first.sablonId,
    ekiciId: first.ekiciId,
    mintikaId: first.mintikaId,
    cevaplar: payloads.map((payload) => ({
      soruId: payload.soruId,
      cevapText: payload.cevapText ?? null,
      cevapNumeric: payload.cevapNumeric ?? null,
      cevapDatetime: payload.cevapDatetime ?? null,
      cevapAltSecenekId: payload.cevapAltSecenekId ?? null,
      cevapAltSecenekIds: payload.cevapAltSecenekIds ?? null,
      birimId: payload.birimId ?? null,
      ustSoruId: payload.ustSoruId ?? null,
    })),
  }
}
