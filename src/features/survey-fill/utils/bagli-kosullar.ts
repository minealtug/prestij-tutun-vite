import { normalizeBagliKosulTipi } from '@/features/questions/utils/bagli-kosul-tipi'
import type { BagliKosul, SurveyFillSoruView } from '../types/anket-yanit.types'

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function readOptionalPositiveId(raw: unknown): number | null {
  const num = Number(raw)
  return Number.isFinite(num) && num > 0 ? num : null
}

export function parseBagliKosullar(raw: unknown): BagliKosul[] {
  if (!Array.isArray(raw)) return []

  const items: BagliKosul[] = []
  const seen = new Set<string>()

  for (const entry of raw) {
    const row = asRecord(entry)
    const parentSoruId = readOptionalPositiveId(
      pick(row, 'parentSoruId', 'ParentSoruId', 'bagliOlduguSoruId', 'BagliOlduguSoruId'),
    )
    if (parentSoruId == null) continue

    const bagliAltSecenekId = readOptionalPositiveId(
      pick(row, 'bagliAltSecenekId', 'BagliAltSecenekId'),
    )
    const bagliKosulTipi = normalizeBagliKosulTipi(
      pick(row, 'bagliKosulTipi', 'BagliKosulTipi'),
    )
    const key = `${parentSoruId}:${bagliAltSecenekId ?? 0}:${bagliKosulTipi}`
    if (seen.has(key)) continue
    seen.add(key)

    items.push({
      parentSoruId,
      bagliAltSecenekId,
      bagliKosulTipi,
    })
  }

  return items
}

export function getEffectiveBagliKosullar(
  question: Pick<
    SurveyFillSoruView,
    'bagliKosullar' | 'bagliOlduguSoruId' | 'bagliAltSecenekId' | 'bagliKosulTipi'
  >,
): BagliKosul[] {
  if (question.bagliKosullar && question.bagliKosullar.length > 0) {
    return question.bagliKosullar
  }

  const parentSoruId = question.bagliOlduguSoruId
  if (parentSoruId == null || parentSoruId <= 0) return []

  return [
    {
      parentSoruId,
      bagliAltSecenekId: question.bagliAltSecenekId ?? null,
      bagliKosulTipi: question.bagliKosulTipi ?? null,
    },
  ]
}

export function getDeclaredBagliParentSoruIds(
  question: Pick<SurveyFillSoruView, 'bagliKosullar' | 'bagliOlduguSoruId'>,
): number[] {
  const ids: number[] = []
  const seen = new Set<number>()

  const source =
    question.bagliKosullar && question.bagliKosullar.length > 0
      ? question.bagliKosullar.map((item) => item.parentSoruId)
      : question.bagliOlduguSoruId != null && question.bagliOlduguSoruId > 0
        ? [question.bagliOlduguSoruId]
        : []

  for (const parentSoruId of source) {
    if (parentSoruId <= 0 || seen.has(parentSoruId)) continue
    seen.add(parentSoruId)
    ids.push(parentSoruId)
  }

  return ids
}
