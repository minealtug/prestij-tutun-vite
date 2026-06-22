import type { QuestionDto } from '../types/question.types'

type QuestionWithBirim = QuestionDto & {
  anketCevapBirim?: { adi?: string | null; id?: number | null } | null
  birimAdi?: string | null
  BirimAdi?: string | null
  AnketCevapBirimId?: number | null
  AnketCevapBirimAdi?: string | null
}

export function resolveQuestionBirimId(row: QuestionWithBirim): number | null {
  const flatId = Number(row.anketCevapBirimId ?? row.AnketCevapBirimId)
  if (Number.isFinite(flatId) && flatId > 0) return flatId

  const nestedId = Number(row.anketCevapBirim?.id)
  if (Number.isFinite(nestedId) && nestedId > 0) return nestedId

  return null
}

export function resolveQuestionBirimAdi(
  row: QuestionWithBirim,
  unitsById: ReadonlyMap<number, string>,
): string | null {
  const nested = row.anketCevapBirim?.adi?.trim()
  if (nested) return nested

  const direct =
    row.anketCevapBirimAdi?.trim() ||
    row.birimAdi?.trim() ||
    row.BirimAdi?.trim() ||
    row.AnketCevapBirimAdi?.trim()
  if (direct) return direct

  const id = resolveQuestionBirimId(row)
  if (id == null) return null

  return unitsById.get(id) ?? null
}
