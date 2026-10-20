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

/** `/api/Gezi/tutunu-olan-uretici-sayisi` gibi sayı yanıtlarını okur. */
export function parseCountNumber(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, raw)
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) return Math.max(0, parsed)
  }

  const row = asRecord(raw)
  if (!row) return 0

  for (const key of [
    'sayi',
    'Sayi',
    'count',
    'Count',
    'adet',
    'Adet',
    'tutunuOlanUreticiSayisi',
    'TutunuOlanUreticiSayisi',
    'data',
    'Data',
    'value',
    'Value',
  ]) {
    const nested = parseCountNumber(row[key])
    if (nested > 0 || typeof row[key] === 'number') return nested
  }

  return 0
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
