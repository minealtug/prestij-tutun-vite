import type { QuestionDto } from '@/features/questions/types/question.types'
import type { QuestionMatch } from '../config/anket-cevaplari-excel-columns'

export interface AnketCevapExcelSourceColumn {
  index: number
  header: string
  questionText: string
  parentText: string
  optionAdi: string
  questionId: string
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[?？]/g, '')
    .replace(/\s+/g, ' ')
}

/** Parantez içi birim/açıklama metinlerini düşürerek soru kimliği karşılaştırması. */
export function coreQuestionKey(value: string): string {
  return normalizeKey(value)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveParentQuestionText(question: QuestionDto, questions: QuestionDto[]): string {
  const parentId = question.bagliOlduguSoruId
  if (parentId != null && parentId > 0) {
    const parent = questions.find((item) => Number(item.id) === parentId)
    if (parent?.soruMetni?.trim()) return parent.soruMetni.trim()
  }

  if (typeof question.bagliOlduguSoru === 'string' && question.bagliOlduguSoru.trim()) {
    return question.bagliOlduguSoru.trim()
  }

  if (question.bagliOlduguSoru && typeof question.bagliOlduguSoru === 'object') {
    const text = question.bagliOlduguSoru.soruMetni?.trim()
    if (text) return text
  }

  return ''
}

function matchQuestion(header: string, unused: QuestionDto[]): QuestionDto | undefined {
  const key = coreQuestionKey(header)
  const index = unused.findIndex((question) => coreQuestionKey(question.soruMetni) === key)
  if (index < 0) return undefined
  return unused.splice(index, 1)[0]
}

export function buildAnketCevapExcelSources(
  soruKolonlari: string[],
  questions: QuestionDto[] = [],
  optionNameById: ReadonlyMap<number, string> = new Map(),
): AnketCevapExcelSourceColumn[] {
  const unused = [...questions]
  return soruKolonlari.map((header, index) => {
    const question = matchQuestion(header, unused)
    const parentText = question ? resolveParentQuestionText(question, questions) : ''
    const optionAdi =
      question?.bagliAltSecenekId != null ? optionNameById.get(question.bagliAltSecenekId)?.trim() ?? '' : ''

    return {
      index,
      header,
      questionText: question?.soruMetni?.trim() || header,
      parentText,
      optionAdi,
      questionId: question ? String(question.id) : `col-${index}`,
    }
  })
}

function questionCandidates(match: QuestionMatch): string[] {
  return (Array.isArray(match.question) ? match.question : [match.question]).map(coreQuestionKey)
}

function hasExcluded(source: AnketCevapExcelSourceColumn, exclude?: string[]): boolean {
  if (!exclude?.length) return false
  const haystack = `${normalizeKey(source.questionText)} ${normalizeKey(source.header)}`
  return exclude.some((item) => haystack.includes(normalizeKey(item)))
}

export function sourceMatches(source: AnketCevapExcelSourceColumn, match: QuestionMatch): boolean {
  if (hasExcluded(source, match.exclude)) return false

  const keys = questionCandidates(match)
  const sourceKeys = [coreQuestionKey(source.questionText), coreQuestionKey(source.header)]
  if (!keys.some((key) => sourceKeys.includes(key))) return false

  if (match.parent) {
    const parentKey = coreQuestionKey(match.parent)
    const sourceParent = coreQuestionKey(source.parentText)
    if (sourceParent !== parentKey && !sourceKeys.includes(parentKey)) return false
  }

  if (match.option) {
    return optionMatches(source, match.option)
  }

  return true
}

function compactKey(value: string): string {
  return normalizeKey(value).replace(/\s+/g, '')
}

function optionMatches(source: AnketCevapExcelSourceColumn, option: string): boolean {
  const optionKey = compactKey(option)
  const sourceOption = compactKey(source.optionAdi)
  if (sourceOption && sourceOption === optionKey) return true

  const headerKey = compactKey(source.header)
  const hasKendiIcar = headerKey.includes('kendi+icar')

  if (optionKey === 'kendi+icar') return hasKendiIcar
  if (optionKey === 'icar') return !hasKendiIcar && (sourceOption === 'icar' || sourceOption === '')
  if (optionKey === 'kendi') return !hasKendiIcar && (sourceOption === 'kendi' || sourceOption === '')

  return headerKey.includes(`${optionKey}—`) || headerKey.includes(`${optionKey}-`)
}

export function findMatchingSources(
  sources: AnketCevapExcelSourceColumn[],
  match: QuestionMatch,
): AnketCevapExcelSourceColumn[] {
  return sources.filter((source) => sourceMatches(source, match))
}

export function isErismeImkaniQuestion(source: AnketCevapExcelSourceColumn): boolean {
  const key = normalizeKey(`${source.questionText} ${source.header}`)
  return key.includes('erişme imkan') || key.includes('erisme imkan')
}
