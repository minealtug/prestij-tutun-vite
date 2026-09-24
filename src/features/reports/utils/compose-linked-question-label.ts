function normalizeLabelPart(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .replace(/[?？]/g, '')
}

/** Seçenek adı soru metninde zaten varsa tekrar yazılmaz (13-24-12: 13-24-12 kullanım…). */
export function composeLinkedQuestionLabel(questionText: string, optionAdi?: string | null): string {
  const text = questionText.trim()
  const option = optionAdi?.trim() ?? ''
  if (!text) return option
  if (!option) return text
  if (normalizeLabelPart(text).includes(normalizeLabelPart(option))) return text
  return `${option} — ${text}`
}
