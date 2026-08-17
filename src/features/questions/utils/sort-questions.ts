import type { QuestionDto, UpdateAnketSoruSiraItem } from '../types/question.types'

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

function compareBySiraNoThenId(left: QuestionDto, right: QuestionDto): number {
  const leftSira = left.siraNo != null && left.siraNo > 0 ? left.siraNo : Number.MAX_SAFE_INTEGER
  const rightSira = right.siraNo != null && right.siraNo > 0 ? right.siraNo : Number.MAX_SAFE_INTEGER
  if (leftSira !== rightSira) return leftSira - rightSira
  return numericId(left) - numericId(right)
}

export function assignQuestionSiraNo(questions: QuestionDto[]): QuestionDto[] {
  return questions.map((question, index) => ({ ...question, siraNo: index + 1 }))
}

function buildQuestionTree(questions: QuestionDto[]): QuestionNode[] {
  const sorted = [...questions].sort(compareBySiraNoThenId)
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

export function sortQuestionsForSurvey(questions: QuestionDto[]): QuestionDto[] {
  if (questions.length <= 1) return questions

  const groups = new Map<number, QuestionDto[]>()
  for (const question of questions) {
    const group = groups.get(question.baslikId) ?? []
    group.push(question)
    groups.set(question.baslikId, group)
  }

  const result: QuestionDto[] = []
  for (const group of groups.values()) {
    result.push(...flattenQuestionTree(buildQuestionTree(group)))
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
): { canMoveUp: boolean; canMoveDown: boolean } {
  const ordered = sortQuestionsForSurvey(questions)
  const state = getSiblingMoveState(buildQuestionTree(ordered), String(id))
  return state ?? { canMoveUp: false, canMoveDown: false }
}

export function moveQuestionInSurvey(
  questions: QuestionDto[],
  id: string | number,
  direction: QuestionMoveDirection,
): QuestionDto[] {
  const ordered = sortQuestionsForSurvey(questions)
  const result = moveAmongSiblings(buildQuestionTree(ordered), String(id), direction)
  if (!result.moved) return ordered
  return assignQuestionSiraNo(flattenQuestionTree(result.nodes))
}

export function toSiraUpdateItems(questions: QuestionDto[]): UpdateAnketSoruSiraItem[] {
  return assignQuestionSiraNo(questions)
    .map((question) => ({
      id: numericId(question),
      siraNo: question.siraNo ?? 0,
    }))
    .filter((item) => item.id > 0 && item.siraNo > 0)
}
