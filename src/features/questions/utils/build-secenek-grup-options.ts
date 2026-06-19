import type { AltSecenekDto, SecenekGrupOption } from '../types/alt-secenek.types'
import { formatSecenekGrupOptionLabel } from './question-field-labels'

export function buildSecenekGrupOptions(altSecenekler: AltSecenekDto[]): SecenekGrupOption[] {
  const byGrup = new Map<number, AltSecenekDto[]>()

  for (const item of altSecenekler) {
    const list = byGrup.get(item.secenekGrupId) ?? []
    list.push(item)
    byGrup.set(item.secenekGrupId, list)
  }

  return [...byGrup.entries()]
    .sort(([leftId], [rightId]) => leftId - rightId)
    .map(([secenekGrupId, items]) => {
      const sorted = [...items].sort((left, right) => {
        if (left.siraNo !== right.siraNo) return left.siraNo - right.siraNo
        return left.adi.localeCompare(right.adi, 'tr-TR')
      })
      const names = sorted.map((item) => item.adi).join(' / ')
      return {
        id: secenekGrupId,
        label: formatSecenekGrupOptionLabel(secenekGrupId, names),
      }
    })
}
