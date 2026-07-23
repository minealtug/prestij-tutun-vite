import type { SurveyFillSoruView } from '../types/anket-yanit.types'

export function resolveSurveyFillBirimAdi(
  question: SurveyFillSoruView,
  unitsById: ReadonlyMap<number, string> = new Map(),
): string | null {
  const direct = question.anketCevapBirimAdi?.trim()
  if (direct) return direct

  const id = question.anketCevapBirimId
  if (id != null && id > 0) {
    const fromMap = unitsById.get(id)?.trim()
    if (fromMap) return fromMap
  }

  return null
}
