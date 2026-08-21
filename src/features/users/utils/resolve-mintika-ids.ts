export interface MintikaRef {
  id: number
  adi: string
}

function readPositiveId(value: unknown): number | null {
  if (value && typeof value === 'object' && 'id' in value) {
    return readPositiveId((value as { id: unknown }).id)
  }
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

export function uniquePositiveIds(values: unknown): number[] {
  if (!Array.isArray(values)) return []
  const ids: number[] = []
  const seen = new Set<number>()
  for (const value of values) {
    const id = readPositiveId(value)
    if (id == null || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

export function resolveMintikaIds(source: {
  mintikaIds?: unknown
  mintikaId?: number | null
  mintikalar?: Array<{ id: number }> | null
}): number[] {
  const fromIds = uniquePositiveIds(source.mintikaIds)
  if (fromIds.length > 0) return fromIds

  const fromEntities = uniquePositiveIds(source.mintikalar)
  if (fromEntities.length > 0) return fromEntities

  if (source.mintikaId != null && source.mintikaId > 0) return [source.mintikaId]
  return []
}

export function formatMintikaAdi(
  mintikaAdi?: string | null,
  mintikalar?: Array<{ adi?: string | null }> | null,
): string {
  const fromApi = mintikaAdi?.trim()
  if (fromApi) return fromApi
  return (mintikalar ?? [])
    .map((item) => item.adi?.trim())
    .filter((adi): adi is string => Boolean(adi))
    .join(', ')
}

export function userHasMintikaAssignment(source: {
  admin?: boolean
  mintikaIds?: unknown
  mintikaId?: number | null
  mintikalar?: Array<{ id: number }> | null
}): boolean {
  if (source.admin) return true
  return resolveMintikaIds(source).length > 0
}
