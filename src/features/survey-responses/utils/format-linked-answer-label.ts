import type { QuestionDto } from '@/features/questions/types/question.types'
import { composeLinkedQuestionLabel } from '@/features/reports/utils/compose-linked-question-label'
import { isKontratSahibiDuplicateReportColumn } from '@/features/reports/utils/visible-soru-kolonlari'
import type { SoruCevapDisplay } from '../types/survey-response.types'

export function filterDuplicateKontratSahibiAnswers(
  nodes: SoruCevapDisplay[],
): SoruCevapDisplay[] {
  return nodes
    .filter((node) => !isKontratSahibiDuplicateReportColumn(node.soruMetni))
    .map((node) => ({
      ...node,
      children: filterDuplicateKontratSahibiAnswers(node.children),
    }))
}

export function formatLinkedAnswerLabel(
  node: SoruCevapDisplay,
  questionsById: ReadonlyMap<number, QuestionDto> = new Map(),
  optionNameById: ReadonlyMap<number, string> = new Map(),
): string {
  const question = questionsById.get(node.soruId)
  const optionId = node.bagliAltSecenekId ?? question?.bagliAltSecenekId ?? null
  const optionAdi = optionId != null ? optionNameById.get(optionId)?.trim() : ''
  const text = node.soruMetni.trim()
  if (optionAdi) return composeLinkedQuestionLabel(text, optionAdi)
  if (node.altSoruMetni?.trim() && node.altSoruMetni.trim() !== text) {
    return composeLinkedQuestionLabel(text, node.altSoruMetni)
  }
  return text
}

function normalizeAnswerPart(value: string) {
  return value.trim().toLocaleLowerCase('tr-TR')
}

function childOptionNames(
  node: SoruCevapDisplay,
  questionsById: ReadonlyMap<number, QuestionDto>,
  optionNameById: ReadonlyMap<number, string>,
): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  for (const child of node.children) {
    const question = questionsById.get(child.soruId)
    const optionId = child.bagliAltSecenekId ?? question?.bagliAltSecenekId ?? null
    const optionAdi = optionId != null ? optionNameById.get(optionId)?.trim() : ''
    if (!optionAdi) continue
    const key = normalizeAnswerPart(optionAdi)
    if (seen.has(key)) continue
    seen.add(key)
    names.push(optionAdi)
  }

  return names
}

/** Çoklu seçimde tek seçenek kaldıysa, bağlı sorulardaki seçeneklerden tam listeyi tamamlar. */
export function enrichMultiSelectAnswers(
  nodes: SoruCevapDisplay[],
  questionsById: ReadonlyMap<number, QuestionDto> = new Map(),
  optionNameById: ReadonlyMap<number, string> = new Map(),
): SoruCevapDisplay[] {
  return nodes.map((node) => {
    const children = enrichMultiSelectAnswers(node.children, questionsById, optionNameById)
    const options = childOptionNames(node, questionsById, optionNameById)
    const current = node.cevapMetni?.trim() ?? ''
    const currentKey = normalizeAnswerPart(current)
    const matchesOneOption = options.some((option) => normalizeAnswerPart(option) === currentKey)

    return {
      ...node,
      children,
      cevapMetni:
        options.length > 1 && (current === '' || matchesOneOption)
          ? options.join(', ')
          : node.cevapMetni,
    }
  })
}

export function labelLinkedAnswerTree(
  nodes: SoruCevapDisplay[],
  questionsById: ReadonlyMap<number, QuestionDto> = new Map(),
  optionNameById: ReadonlyMap<number, string> = new Map(),
): SoruCevapDisplay[] {
  return nodes.map((node) => ({
    ...node,
    soruMetni: node.bagliSoru
      ? formatLinkedAnswerLabel(node, questionsById, optionNameById)
      : node.soruMetni,
    children: labelLinkedAnswerTree(node.children, questionsById, optionNameById),
  }))
}

export function collectLabeledDescendants(
  node: SoruCevapDisplay,
  questionsById: ReadonlyMap<number, QuestionDto> = new Map(),
  optionNameById: ReadonlyMap<number, string> = new Map(),
): Array<{ node: SoruCevapDisplay; label: string }> {
  const result: Array<{ node: SoruCevapDisplay; label: string }> = []
  const seen = new Map<string, number>()

  const walk = (current: SoruCevapDisplay) => {
    for (const child of current.children) {
      let label = formatLinkedAnswerLabel(child, questionsById, optionNameById)
      const count = seen.get(label) ?? 0
      seen.set(label, count + 1)
      if (count > 0 && !label.includes('—')) {
        label = composeLinkedQuestionLabel(label, current.soruMetni)
      }
      result.push({ node: child, label })
      walk(child)
    }
  }

  walk(node)
  return result
}
