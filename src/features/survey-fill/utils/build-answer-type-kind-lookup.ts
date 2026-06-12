import type { CevapGirdiTipDto } from '@/features/questions/types/question.types'
import { resolveAnswerInputKind, type AnswerInputKind } from './resolve-answer-input-kind'

export type AnswerTypeKindLookup = ReadonlyMap<number, AnswerInputKind>

/** `/api/AnketCevapGirdiTip` yanıtından id → form alanı eşlemesi üretir. */
export function buildAnswerTypeKindLookup(
  types: CevapGirdiTipDto[] | undefined,
): AnswerTypeKindLookup {
  const map = new Map<number, AnswerInputKind>()
  for (const type of types ?? []) {
    if (!Number.isFinite(type.id) || type.id <= 0) continue
    map.set(type.id, resolveAnswerInputKind(type.adi))
  }
  return map
}

export function getAnswerTypeAdiById(
  types: CevapGirdiTipDto[] | undefined,
  tipId: number | null | undefined,
): string | null {
  if (tipId == null || !Number.isFinite(tipId) || tipId <= 0) return null
  return types?.find((type) => type.id === tipId)?.adi ?? null
}
