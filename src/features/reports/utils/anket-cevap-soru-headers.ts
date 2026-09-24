import type { QuestionDto } from '@/features/questions/types/question.types'
import type { VisibleSoruKolonu } from './visible-soru-kolonlari'

export interface AnketCevapSoruColumn {
  index: number
  header: string
  parentHeader: string
  subHeader: string
  isChild: boolean
  groupKey: string
}

export interface AnketCevapSoruGroup {
  parentHeader: string
  columns: AnketCevapSoruColumn[]
}

function normalizeSoruHeader(header: string) {
  return header
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .replace(/[?？]/g, '')
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

function matchQuestion(
  header: string,
  unused: QuestionDto[],
): QuestionDto | undefined {
  const normalized = normalizeSoruHeader(header)
  const index = unused.findIndex((question) => normalizeSoruHeader(question.soruMetni) === normalized)
  if (index < 0) return undefined
  return unused.splice(index, 1)[0]
}

function attachIdenticalRunsToPreviousParent(
  columns: AnketCevapSoruColumn[],
): AnketCevapSoruColumn[] {
  const next = columns.map((column) => ({ ...column }))
  let i = 0
  while (i < next.length) {
    const current = next[i]
    let end = i + 1
    while (end < next.length && normalizeSoruHeader(next[end].header) === normalizeSoruHeader(current.header)) {
      end += 1
    }

    const run = next.slice(i, end)
    if (end - i > 1 && i > 0 && run.every((column) => !column.isChild)) {
      const parent = next[i - 1]
      for (let k = i; k < end; k += 1) {
        next[k].isChild = true
        next[k].parentHeader = parent.parentHeader
        next[k].groupKey = parent.groupKey
      }
    }

    i = end
  }

  return next
}

export function resolveAnketCevapSoruColumns(
  visible: VisibleSoruKolonu[],
  questions: QuestionDto[] = [],
  optionNameById: ReadonlyMap<number, string> = new Map(),
): AnketCevapSoruColumn[] {
  const unused = [...questions]
  const matched = visible.map((column, order) => {
    const question = matchQuestion(column.header, unused)
    const isLinked =
      Boolean(question?.bagliSoru) &&
      question?.bagliOlduguSoruId != null &&
      question.bagliOlduguSoruId > 0
    const parentHeader = question && isLinked ? resolveParentQuestionText(question, questions) : column.header
    const optionAdi =
      question?.bagliAltSecenekId != null ? optionNameById.get(question.bagliAltSecenekId)?.trim() : ''
    const subHeader = optionAdi ? `${optionAdi}: ${column.header}` : column.header

    return {
      index: column.index,
      header: column.header,
      parentHeader: parentHeader || column.header,
      subHeader,
      isChild: Boolean(isLinked && parentHeader),
      groupKey: question
        ? `q-${isLinked ? question.bagliOlduguSoruId : question.id}`
        : `col-${order}`,
    }
  })

  return attachIdenticalRunsToPreviousParent(matched)
}

export function groupAnketCevapSoruColumns(columns: AnketCevapSoruColumn[]): AnketCevapSoruGroup[] {
  const groups: AnketCevapSoruGroup[] = []

  for (const column of columns) {
    const last = groups[groups.length - 1]
    if (last && last.columns[0]?.groupKey === column.groupKey) {
      last.columns.push(column)
      if (column.isChild && !last.parentHeader) last.parentHeader = column.parentHeader
      continue
    }

    groups.push({
      parentHeader: column.isChild ? column.parentHeader : column.header,
      columns: [column],
    })
  }

  return groups
}

export function getAnketCevapSoruTableHeader(column: AnketCevapSoruColumn): string {
  if (!column.isChild) return column.header
  if (column.parentHeader && column.parentHeader !== column.header) {
    return `${column.parentHeader} — ${column.subHeader}`
  }
  return column.subHeader
}
