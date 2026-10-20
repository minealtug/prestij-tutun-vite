import type { QuestionDto } from '@/features/questions/types/question.types'
import { listQuestionDisplayRows } from '@/features/questions/utils/sort-questions'

export interface VisibleSoruKolonu {
  header: string
  /** `cevaplar` dizisindeki indeks. API kolonunda yoksa -1 (hücre boş). */
  index: number
  question?: QuestionDto
  outline?: string
  displayKey?: string
}

function normalizeSoruHeader(header: string) {
  return header
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .replace(/[?？]/g, '')
}

/**
 * Kontrat sahibi cinsiyet / doğum tarihi / ad-soyad soruları ekici kolonlarında
 * zaten vardır; raporda ve Excel'de tekrar etmemeli.
 * Üretici (eksper) soruları gizlenmez.
 */
export function isKontratSahibiDuplicateReportColumn(header: string): boolean {
  const normalized = normalizeSoruHeader(header)
  if (!normalized.includes('kontrat sahibi')) return false

  if (normalized.includes('cinsiyet')) return true
  if (normalized.includes('doğum') || normalized.includes('dogum')) return true
  if (
    normalized.includes('ad-soyad') ||
    normalized.includes('ad soyad') ||
    normalized.includes('adsoyad') ||
    (normalized.includes('ad') && normalized.includes('soyad'))
  ) {
    return true
  }

  return false
}

function apiColumnsFromHeaders(soruKolonlari: string[]): VisibleSoruKolonu[] {
  return soruKolonlari.flatMap((header, index) =>
    isKontratSahibiDuplicateReportColumn(header) ? [] : [{ header, index }],
  )
}

/**
 * Rapor kolonları tanımlı sorular listesiyle aynı ağaç ve numaralandırmadır.
 * Pasif sorular o sırada gizlenir; birden fazla üst soruya bağlı alt soru her ebeveynin yanında durur.
 */
export function getVisibleSoruKolonlari(
  soruKolonlari: string[],
  questions: QuestionDto[] = [],
): VisibleSoruKolonu[] {
  const apiColumns = apiColumnsFromHeaders(soruKolonlari)
  if (questions.length === 0) return apiColumns

  const queues = new Map<string, VisibleSoruKolonu[]>()
  for (const column of apiColumns) {
    const key = normalizeSoruHeader(column.header)
    const list = queues.get(key)
    if (list) list.push(column)
    else queues.set(key, [column])
  }

  const indexByQuestionId = new Map<string, number>()
  const merged: VisibleSoruKolonu[] = []

  for (const row of listQuestionDisplayRows(questions)) {
    if (row.aktif === false) continue
    const header = row.soruMetni?.trim() ?? ''
    if (!header) continue
    if (isKontratSahibiDuplicateReportColumn(header)) continue

    const questionId = String(row.id)
    const reusedIndex = indexByQuestionId.get(questionId)
    if (reusedIndex != null) {
      merged.push({
        header,
        index: reusedIndex,
        question: row,
        outline: row.displayOutline,
        displayKey: row.displayKey,
      })
      continue
    }

    const key = normalizeSoruHeader(header)
    const matched = queues.get(key)?.shift()
    const index = matched?.index ?? -1
    indexByQuestionId.set(questionId, index)
    merged.push({
      header,
      index,
      question: row,
      outline: row.displayOutline,
      displayKey: row.displayKey,
    })
  }

  return merged
}
