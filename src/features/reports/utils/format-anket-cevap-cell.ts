/** Bakmakla yükümlü olunan kişi sayısı: yanıt yoksa Excel/raporda 0 yazılmaz, hücre boş kalır. */
export function isBakmaklaYukumluKisiSayisiColumn(header: string): boolean {
  const normalized = header.toLocaleLowerCase('tr-TR')
  return (
    normalized.includes('yükümlü') ||
    normalized.includes('yukumlu') ||
    normalized.includes('bakmakla')
  )
}

function isZeroLike(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed === '0' || trimmed === '0,0' || trimmed === '0.0') return true
  const numeric = Number(trimmed.replace(',', '.'))
  return Number.isFinite(numeric) && numeric === 0
}

export function formatAnketCevapCell(header: string, value: unknown): string {
  if (value == null) return ''
  const text = String(value).trim()
  if (!text) return ''
  if (isBakmaklaYukumluKisiSayisiColumn(header) && isZeroLike(text)) return ''
  return text
}
