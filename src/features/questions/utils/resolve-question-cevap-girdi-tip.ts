import type { QuestionDto } from '../types/question.types'

type QuestionWithCevapGirdiTip = QuestionDto & {
  cevapGirdiTip?: { id?: number | null; adi?: string | null } | null
  CevapGirdiTip?: { id?: number | null; adi?: string | null } | null
}

export function resolveCevapGirdiTipAdi(row: QuestionWithCevapGirdiTip): string | null {
  const direct = row.cevapGirdiTipAdi?.trim()
  if (direct) return direct

  const nested = row.cevapGirdiTip?.adi?.trim() || row.CevapGirdiTip?.adi?.trim()
  if (nested) return nested

  return null
}

export function resolveCevapGirdiTipId(row: QuestionWithCevapGirdiTip): number | null {
  const flatId = Number(row.cevapGirdiTipId)
  if (Number.isFinite(flatId) && flatId > 0) return flatId

  const nestedId = Number(row.cevapGirdiTip?.id ?? row.CevapGirdiTip?.id)
  if (Number.isFinite(nestedId) && nestedId > 0) return nestedId

  return null
}
