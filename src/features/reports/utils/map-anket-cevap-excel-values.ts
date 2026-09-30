import { LIVING_CONDITION_OPTION_ORDER } from '../config/anket-cevaplari-excel-template'
import type {
  AnketCevapExcelColumn,
  ExcelValueKind,
  QuestionMatch,
} from '../config/anket-cevaplari-excel-columns'
import type { AnketCevapRow } from '../types/anket-cevaplari.types'
import { formatAnketCevapCell } from './format-anket-cevap-cell'
import {
  findMatchingSources,
  isErismeImkaniQuestion,
  type AnketCevapExcelSourceColumn,
} from './anket-cevap-excel-source'
import { toDateInputValue } from '@/features/survey-fill/utils/date-input-value'

export type ExcelCellValue = string | number | null

const EMPTY_SENTINELS = new Set(['null', 'undefined'])

export function isBlankExcelAnswer(value: unknown): boolean {
  if (value == null) return true
  const text = String(value).trim()
  if (!text) return true
  return EMPTY_SENTINELS.has(text.toLocaleLowerCase('tr-TR'))
}

function rawCell(header: string, value: unknown): string {
  if (isBlankExcelAnswer(value)) return ''
  return formatAnketCevapCell(header, value)
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const text = value.trim()
    if (!text) continue
    const key = text.toLocaleLowerCase('tr-TR')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(text)
  }
  return result
}

export function joinUniqueComma(values: string[], order: readonly string[] = []): string {
  const items = uniqueNonEmpty(values.flatMap((value) => value.split(',').map((part) => part.trim())))
  if (order.length > 0) {
    const rank = new Map(order.map((name, index) => [name.toLocaleLowerCase('tr-TR'), index]))
    items.sort((left, right) => {
      const leftRank = rank.get(left.toLocaleLowerCase('tr-TR')) ?? Number.MAX_SAFE_INTEGER
      const rightRank = rank.get(right.toLocaleLowerCase('tr-TR')) ?? Number.MAX_SAFE_INTEGER
      if (leftRank !== rightRank) return leftRank - rightRank
      return left.localeCompare(right, 'tr-TR')
    })
  }
  return items.join(',')
}

function isYesAnswer(value: string): boolean {
  const key = value.trim().toLocaleLowerCase('tr-TR')
  return key === 'evet' || key === 'var' || key === 'true'
}

function pickSingleValue(header: string, sources: AnketCevapExcelSourceColumn[], cevaplar: string[]): string {
  const values = uniqueNonEmpty(sources.map((source) => rawCell(header, cevaplar[source.index])))
  if (values.length === 0) return ''
  if (values.length === 1) return values[0]
  return ''
}

function normalizeOwnership(value: string): string {
  return value.replace(/\s+/g, '').toLocaleLowerCase('tr-TR')
}

function resolveActiveBranch(
  column: AnketCevapExcelColumn,
  sources: AnketCevapExcelSourceColumn[],
  cevaplar: string[],
  parentMatch: QuestionMatch,
  branches: { when: string; match: QuestionMatch }[],
): string {
  const parentValue = pickSingleValue(column.title, findMatchingSources(sources, parentMatch), cevaplar)
  const parentKey = normalizeOwnership(parentValue)

  if (parentKey) {
    const branch = branches.find((item) => normalizeOwnership(item.when) === parentKey)
    if (!branch) return ''
    return pickSingleValue(column.title, findMatchingSources(sources, branch.match), cevaplar)
  }

  const filled = branches
    .map((branch) => pickSingleValue(column.title, findMatchingSources(sources, branch.match), cevaplar))
    .filter((value) => value.length > 0)
  const unique = uniqueNonEmpty(filled)
  return unique.length === 1 ? unique[0] : ''
}

function parentQuestionAsSource(source: AnketCevapExcelSourceColumn): AnketCevapExcelSourceColumn {
  return {
    ...source,
    questionText: source.parentText,
    header: source.parentText,
    parentText: '',
    optionAdi: '',
  }
}

function resolveJoinYesOptions(
  column: AnketCevapExcelColumn,
  sources: AnketCevapExcelSourceColumn[],
  cevaplar: string[],
  parent: QuestionMatch,
  optionOrder: ReadonlyMap<string, number>,
): string {
  const livingChildren = sources.filter(
    (source) =>
      isErismeImkaniQuestion(source) &&
      Boolean(source.optionAdi) &&
      findMatchingSources([parentQuestionAsSource(source)], parent).length > 0,
  )

  if (livingChildren.length > 0) {
    const names = livingChildren
      .filter((source) => isYesAnswer(rawCell(column.title, cevaplar[source.index])))
      .map((source) => source.optionAdi)
    return joinUniqueComma(names, resolveOrder(names, optionOrder))
  }

  const parentAnswers = findMatchingSources(sources, parent)
    .filter((source) => !isErismeImkaniQuestion(source))
    .map((source) => rawCell(column.title, cevaplar[source.index]))
  return joinUniqueComma(parentAnswers, [...LIVING_CONDITION_OPTION_ORDER])
}

function resolveOrder(names: string[], optionOrder: ReadonlyMap<string, number>): string[] {
  if (optionOrder.size > 0) {
    const ranked = [...names].sort((left, right) => {
      const leftRank = optionOrder.get(left.toLocaleLowerCase('tr-TR')) ?? Number.MAX_SAFE_INTEGER
      const rightRank = optionOrder.get(right.toLocaleLowerCase('tr-TR')) ?? Number.MAX_SAFE_INTEGER
      return leftRank - rightRank
    })
    if (ranked.some((name) => optionOrder.has(name.toLocaleLowerCase('tr-TR')))) return ranked
  }
  return [...LIVING_CONDITION_OPTION_ORDER]
}

function resolveQuestionValue(
  column: AnketCevapExcelColumn,
  sources: AnketCevapExcelSourceColumn[],
  cevaplar: string[],
  match: QuestionMatch,
  joinMulti: boolean,
  optionOrder: ReadonlyMap<string, number>,
): string {
  const matched = findMatchingSources(sources, match)
  const values = matched.map((source) => rawCell(column.title, cevaplar[source.index]))
  if (joinMulti) {
    const order = [...optionOrder.entries()]
      .sort((left, right) => left[1] - right[1])
      .map(([name]) => name)
    return joinUniqueComma(values, order)
  }
  return pickSingleValue(column.title, matched, cevaplar)
}

export function formatExcelDateText(value: string): string {
  const iso = toDateInputValue(value)
  if (!iso) return value.trim()
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

export function dateToExcelSerial(value: string): number | null {
  const iso = toDateInputValue(value)
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86_400_000 + 25569
}

function toTypedValue(kind: ExcelValueKind, text: string): ExcelCellValue {
  if (!text) return null
  if (kind === 'dateText') return formatExcelDateText(text)
  if (kind === 'dateExcel') return dateToExcelSerial(text)
  if (kind === 'number') {
    const numeric = Number(text.replace(',', '.'))
    return Number.isFinite(numeric) ? numeric : text
  }
  return text
}

function resolveTextValue(
  column: AnketCevapExcelColumn,
  row: AnketCevapRow,
  sources: AnketCevapExcelSourceColumn[],
  optionOrder: ReadonlyMap<string, number>,
): string {
  const source = column.source
  if (source.type === 'fixed') {
    const value = row[source.key]
    if (source.key === 'tc') return String(value ?? '').trim()
    if (source.key === 'uretimiYapan' || source.key === 'anketAdi') return String(value ?? '').trim()
    return rawCell(column.title, value)
  }
  if (source.type === 'question') {
    return resolveQuestionValue(column, sources, row.cevaplar, source.match, false, optionOrder)
  }
  if (source.type === 'joinMulti') {
    return resolveQuestionValue(column, sources, row.cevaplar, source.match, true, optionOrder)
  }
  if (source.type === 'activeBranch') {
    return resolveActiveBranch(column, sources, row.cevaplar, source.parent, source.branches)
  }
  return resolveJoinYesOptions(column, sources, row.cevaplar, source.parent, optionOrder)
}

export function resolveAnketCevapExcelCell(
  column: AnketCevapExcelColumn,
  row: AnketCevapRow,
  sources: AnketCevapExcelSourceColumn[],
  optionOrder: ReadonlyMap<string, number> = new Map(),
): ExcelCellValue {
  if (column.blank) return null
  let text = resolveTextValue(column, row, sources, optionOrder)
  if (column.source.type === 'fixed' && column.source.key === 'anketAdi' && !text) {
    text = row.anketAdi
  }
  if (column.title.startsWith('Üretimi yapan') && !text) text = row.uretimiYapan.trim()
  return toTypedValue(column.valueKind, text)
}

export function listUnmappedSourceHeaders(
  sources: AnketCevapExcelSourceColumn[],
  columns: AnketCevapExcelColumn[],
): string[] {
  const used = new Set<number>()
  for (const column of columns) {
    const source = column.source
    if (source.type === 'fixed') continue
    if (source.type === 'activeBranch') {
      findMatchingSources(sources, source.parent).forEach((item) => used.add(item.index))
      source.branches.forEach((branch) =>
        findMatchingSources(sources, branch.match).forEach((item) => used.add(item.index)),
      )
      continue
    }
    if (source.type === 'joinYesOptions') {
      findMatchingSources(sources, source.parent).forEach((item) => used.add(item.index))
      sources
        .filter(
          (item) =>
            isErismeImkaniQuestion(item) &&
            item.optionAdi &&
            findMatchingSources([parentQuestionAsSource(item)], source.parent).length > 0,
        )
        .forEach((item) => used.add(item.index))
      continue
    }
    findMatchingSources(sources, source.match).forEach((item) => used.add(item.index))
  }

  return sources.filter((source) => !used.has(source.index)).map((source) => source.header)
}
