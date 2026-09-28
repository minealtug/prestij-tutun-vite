/** API ve form state için YYYY-MM-DD; ekranda GG.AA.YYYY. */

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function fromParts(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return ''
  }
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value?.trim()) return ''

  const trimmed = value.trim()
  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDate) {
    return fromParts(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]))
  }

  const displayDate = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (displayDate) {
    return fromParts(Number(displayDate[3]), Number(displayDate[2]), Number(displayDate[1]))
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return ''

  return fromParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate())
}

export function toDateOnlyApiValue(value: string): string | null {
  const normalized = toDateInputValue(value)
  return normalized || null
}

export function parseDateValue(value: string | null | undefined): Date | null {
  const iso = toDateInputValue(value)
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDisplayDate(value: string | Date | null | undefined): string {
  const date = value instanceof Date ? value : parseDateValue(value ?? '')
  if (!date) return ''
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`
}
