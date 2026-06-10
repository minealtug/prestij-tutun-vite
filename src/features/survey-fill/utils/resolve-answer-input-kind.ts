export type AnswerInputKind = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'checkbox'

export function resolveAnswerInputKind(cevapGirdiTipAdi?: string): AnswerInputKind {
  const normalized = (cevapGirdiTipAdi ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  const compact = normalized.replace(/\s/g, '')

  if (
    normalized.includes('textarea') ||
    normalized.includes('uzun metin') ||
    compact === 'longtext'
  ) {
    return 'textarea'
  }

  if (normalized.includes('checkbox') || normalized.includes('onay')) {
    return 'checkbox'
  }

  if (
    normalized.includes('numeric') ||
    normalized.includes('number') ||
    normalized.includes('sayı')
  ) {
    return 'number'
  }

  if (normalized.includes('datetime') || normalized.includes('date time')) {
    return 'datetime'
  }

  if (normalized.includes('date') || normalized.includes('tarih')) {
    return 'date'
  }

  return 'text'
}
