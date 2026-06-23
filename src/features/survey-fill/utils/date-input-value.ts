/** HTML date input ve API için YYYY-MM-DD üretir. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value?.trim()) return ''

  const trimmed = value.trim()
  const isoDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoDate) return isoDate[1]

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toDateOnlyApiValue(value: string): string | null {
  const normalized = toDateInputValue(value)
  return normalized || null
}
