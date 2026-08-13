import type { QuestionDto } from '../types/question.types'
import {
  questionOrderStorage,
  type QuestionOrderStorage,
} from './question-order-storage'

export type QuestionMoveDirection = 'up' | 'down'

interface QuestionNode {
  question: QuestionDto
  children: QuestionNode[]
}

function questionKey(question: Pick<QuestionDto, 'id'>): string {
  return String(question.id)
}

function numericId(question: Pick<QuestionDto, 'id'>): number {
  const id = Number(question.id)
  return Number.isFinite(id) ? id : 0
}

function compareBySiraThenId(left: QuestionDto, right: QuestionDto): number {
  const leftSira = left.sira != null && left.sira > 0 ? left.sira : Number.MAX_SAFE_INTEGER
  const rightSira = right.sira != null && right.sira > 0 ? right.sira : Number.MAX_SAFE_INTEGER
  if (leftSira !== rightSira) return leftSira - rightSira
  return numericId(left) - numericId(right)
}

export function assignQuestionSira(questions: QuestionDto[]): QuestionDto[] {
  return questions.map((question, index) => ({ ...question, sira: index + 1 }))
}

function applyStoredOrder(questions: QuestionDto[], storedIds: string[]): QuestionDto[] {
  const remaining = new Map(questions.map((question) => [questionKey(question), question]))
  const ordered: QuestionDto[] = []

  for (const id of storedIds) {
    const question = remaining.get(String(id))
    if (!question) continue
    ordered.push(question)
    remaining.delete(String(id))
  }

  const leftovers = [...remaining.values()].sort(compareBySiraThenId)
  return assignQuestionSira([...ordered, ...leftovers])
}

function buildQuestionTree(questions: QuestionDto[]): QuestionNode[] {
  const sorted = [...questions].sort(compareBySiraThenId)
  const ids = new Set(sorted.map((question) => numericId(question)))
  const nodes = new Map<string, QuestionNode>()

  for (const question of sorted) {
    nodes.set(questionKey(question), { question, children: [] })
  }

  const roots: QuestionNode[] = []

  for (const question of sorted) {
    const node = nodes.get(questionKey(question))
    if (!node) continue

    const parentId = question.bagliOlduguSoruId
    const isChild =
      question.bagliSoru && parentId != null && parentId > 0 && ids.has(parentId)
    if (!isChild) {
      roots.push(node)
      continue
    }

    const parent = nodes.get(String(parentId))
    if (!parent || parent === node) {
      roots.push(node)
      continue
    }
    parent.children.push(node)
  }

  return roots
}

function flattenQuestionTree(nodes: QuestionNode[]): QuestionDto[] {
  const result: QuestionDto[] = []

  function walk(node: QuestionNode) {
    result.push(node.question)
    for (const child of node.children) walk(child)
  }

  for (const node of nodes) walk(node)
  return result
}

function sortQuestionGroup(questions: QuestionDto[]): QuestionDto[] {
  return assignQuestionSira(flattenQuestionTree(buildQuestionTree(questions)))
}

export function sortQuestionsForSurvey(
  questions: QuestionDto[],
  storage: QuestionOrderStorage = questionOrderStorage,
): QuestionDto[] {
  if (questions.length <= 1) return assignQuestionSira(questions)

  const groups = new Map<number, QuestionDto[]>()
  for (const question of questions) {
    const group = groups.get(question.baslikId) ?? []
    group.push(question)
    groups.set(question.baslikId, group)
  }

  const result: QuestionDto[] = []
  for (const [baslikId, group] of groups) {
    const storedIds = storage.get(baslikId)
    if (storedIds?.length) {
      result.push(...sortQuestionGroup(applyStoredOrder(group, storedIds)))
      continue
    }

    result.push(...sortQuestionGroup(group))
  }

  return result
}

function findSiblingIndex(nodes: QuestionNode[], id: string): number {
  return nodes.findIndex((node) => questionKey(node.question) === id)
}

function moveAmongSiblings(
  nodes: QuestionNode[],
  id: string,
  direction: QuestionMoveDirection,
): { nodes: QuestionNode[]; moved: boolean } {
  const index = findSiblingIndex(nodes, id)
  if (index >= 0) {
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= nodes.length) return { nodes, moved: false }
    const next = [...nodes]
    ;[next[index], next[swapWith]] = [next[swapWith], next[index]]
    return { nodes: next, moved: true }
  }

  let moved = false
  const next = nodes.map((node) => {
    if (moved) return node
    const childResult = moveAmongSiblings(node.children, id, direction)
    if (!childResult.moved) return node
    moved = true
    return { ...node, children: childResult.nodes }
  })

  return { nodes: next, moved }
}

function getSiblingMoveState(
  nodes: QuestionNode[],
  id: string,
): { canMoveUp: boolean; canMoveDown: boolean } | null {
  const index = findSiblingIndex(nodes, id)
  if (index >= 0) {
    return {
      canMoveUp: index > 0,
      canMoveDown: index < nodes.length - 1,
    }
  }

  for (const node of nodes) {
    const nested = getSiblingMoveState(node.children, id)
    if (nested) return nested
  }

  return null
}

export function getQuestionMoveState(
  questions: QuestionDto[],
  id: string | number,
  storage: QuestionOrderStorage = questionOrderStorage,
): { canMoveUp: boolean; canMoveDown: boolean } {
  const ordered = sortQuestionsForSurvey(questions, storage)
  const state = getSiblingMoveState(buildQuestionTree(ordered), String(id))
  return state ?? { canMoveUp: false, canMoveDown: false }
}

export function moveQuestionInSurvey(
  questions: QuestionDto[],
  id: string | number,
  direction: QuestionMoveDirection,
  storage: QuestionOrderStorage = questionOrderStorage,
): QuestionDto[] {
  const ordered = sortQuestionsForSurvey(questions, storage)
  const result = moveAmongSiblings(buildQuestionTree(ordered), String(id), direction)
  if (!result.moved) return ordered
  return assignQuestionSira(flattenQuestionTree(result.nodes))
}

export function persistQuestionOrder(
  questions: QuestionDto[],
  storage: QuestionOrderStorage = questionOrderStorage,
) {
  const groups = new Map<number, string[]>()
  for (const question of questions) {
    const ids = groups.get(question.baslikId) ?? []
    ids.push(questionKey(question))
    groups.set(question.baslikId, ids)
  }
  for (const [baslikId, ids] of groups) {
    storage.set(baslikId, ids)
  }
}

export function nextQuestionSira(questions: QuestionDto[]): number {
  let max = 0
  for (const question of questions) {
    if (question.sira != null && question.sira > max) max = question.sira
  }
  return max + 1
}
