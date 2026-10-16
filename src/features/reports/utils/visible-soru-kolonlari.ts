import type { QuestionDto } from '@/features/questions/types/question.types'

export interface VisibleSoruKolonu {
  header: string
  /** `cevaplar` dizisindeki indeks. API kolonunda yoksa -1 (hücre boş). */
  index: number
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
 * Rapor kolonları API `soruKolonlari` listesinden gelir; hiç cevaplanmamış sorular
 * bu listede olmayabilir. Anket tanımındaki aktif soruları da ekler, sırayı tanıma göre kurar.
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

  const merged: VisibleSoruKolonu[] = []

  for (const question of questions) {
    if (question.aktif === false) continue
    const header = question.soruMetni?.trim() ?? ''
    if (!header) continue
    if (isKontratSahibiDuplicateReportColumn(header)) continue

    const key = normalizeSoruHeader(header)
    const queue = queues.get(key)
    const matched = queue?.shift()
    merged.push(matched ?? { header, index: -1 })
  }

  for (const leftover of queues.values()) {
    merged.push(...leftover)
  }

  return merged
}
