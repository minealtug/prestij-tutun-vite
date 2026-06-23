const answerTypeLabelMap: Record<string, string> = {
  text: 'Kısa Metin',
  textarea: 'Uzun Metin',
  checkbox: 'Onay Kutusu',
  'check box': 'Onay Kutusu',
  radiobutton: 'Tek Seçim',
  'radio button': 'Tek Seçim',
  select: 'Liste (Açılır Menü)',
  combobox: 'Liste (Açılır Menü)',
  'combo box': 'Liste (Açılır Menü)',
  numeric: 'Sayı',
  number: 'Sayı',
  datetime: 'Tarih',
  'date time': 'Tarih',
  date: 'Tarih',
  time: 'Saat',
}

export function getFriendlyAnswerTypeLabel(name: string) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ')
  const compact = normalized.replace(/\s/g, '')
  return answerTypeLabelMap[normalized] ?? answerTypeLabelMap[compact] ?? name
}

