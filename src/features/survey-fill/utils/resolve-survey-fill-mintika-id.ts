export function resolveSurveyFillMintikaId(sources: {
  oturumMintikaId?: number | null
  ekiciMintikaId?: number | null
  userMintikaId?: number | null
}): number | null {
  const candidates = [sources.oturumMintikaId, sources.ekiciMintikaId, sources.userMintikaId]

  for (const candidate of candidates) {
    if (candidate != null && candidate > 0) return candidate
  }

  return null
}
