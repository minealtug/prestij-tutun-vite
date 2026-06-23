import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'

export interface MintikaDistributionItem {
  label: string
  count: number
  barPercent: number
}

export function computeMintikaDistribution(
  items: AnketCevapOzetItem[],
  limit = 5,
): MintikaDistributionItem[] {
  const counts = new Map<string, number>()

  for (const item of items) {
    const label = item.mintikaAdi?.trim() || 'Belirtilmemiş'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr-TR'))
    .slice(0, limit)

  const maxCount = sorted[0]?.[1] ?? 0

  return sorted.map(([label, count]) => ({
    label,
    count,
    barPercent: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0,
  }))
}
