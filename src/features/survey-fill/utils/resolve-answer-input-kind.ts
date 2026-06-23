export type AnswerInputKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'select'

export function resolveAnswerInputKind(cevapGirdiTipAdi?: string): AnswerInputKind {
  const normalized = (cevapGirdiTipAdi ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  const compact = normalized.replace(/\s/g, '')

  if (
    normalized.includes('radio') ||
    compact === 'radiobutton' ||
    normalized.includes('combo') ||
    compact === 'combobox' ||
    normalized.includes('select') ||
    normalized.includes('liste')
  ) {
    return 'select'
  }

  if (
    normalized.includes('textarea') ||
    normalized.includes('uzun metin') ||
    compact === 'longtext'
  ) {
    return 'textarea'
  }

  if (
    compact.includes('checkbox') ||
    normalized.includes('check box') ||
    normalized.includes('onay kutusu') ||
    normalized.includes('onay')
  ) {
    return 'checkbox'
  }

  if (
    normalized.includes('numeric') ||
    normalized.includes('number') ||
    normalized.includes('sayı')
  ) {
    return 'number'
  }

  if (
    normalized.includes('datetime') ||
    normalized.includes('date time') ||
    normalized.includes('date') ||
    normalized.includes('tarih')
  ) {
    return 'date'
  }

  return 'text'
}
