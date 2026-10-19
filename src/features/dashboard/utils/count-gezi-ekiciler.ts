function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  const row = asRecord(raw)
  if (!row) return []
  for (const key of ['items', 'Items', 'geziler', 'Geziler', 'data', 'Data']) {
    if (Array.isArray(row[key])) return row[key]
  }
  return []
}

function readId(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

/** `/api/Gezi` satırlarından tekil ekici sayısı. */
export function countGeziEkiciler(raw: unknown): number {
  const keys = new Set<string>()
  for (const item of asList(raw)) {
    const row = asRecord(item)
    if (!row) continue
    const key = readId(row, 'ekiciId', 'EkiciId', 'id', 'Id')
    if (key) keys.add(key)
  }
  return keys.size
}
