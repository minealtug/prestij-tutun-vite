import type { QuestionDto, UpdateAnketSoruSiraItem } from '../types/question.types'

export type QuestionMoveDirection = 'up' | 'down'

interface QuestionNode {
  question: QuestionDto
  children: QuestionNode[]
  key: string
}

export interface QuestionDisplayRow extends QuestionDto {
  displayKey: string
  displayDepth: number
  displayOutline: string
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
    const key = questionKey(question)
    nodes.set(key, { question, children: [], key })
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

export interface QuestionDisplayMeta {
  depth: number
  outline: string
}

export function getQuestionDisplayMeta(questions: QuestionDto[]): Map<string, QuestionDisplayMeta> {
  const map = new Map<string, QuestionDisplayMeta>()
  if (questions.length === 0) return map

  const walk = (nodes: QuestionNode[], depth: number, prefix: string) => {
    nodes.forEach((node, index) => {
      const outline = prefix ? `${prefix}.${index + 1}` : String(index + 1)
      map.set(questionKey(node.question), { depth, outline })
      walk(node.children, depth + 1, outline)
    })
  }

  walk(buildQuestionTree(sortQuestionsForSurvey(questions)), 0, '')
  return map
}

function parentIdsInList(question: QuestionDto, ids: Set<number>): number[] {
  const fromKosullar = [
    ...new Set(
      (question.bagliKosullar ?? [])
        .map((item) => item.parentSoruId)
        .filter((id) => id > 0 && ids.has(id)),
    ),
  ]
  if (fromKosullar.length > 0) return fromKosullar

  const parentId = question.bagliOlduguSoruId
  if (question.bagliSoru && parentId != null && parentId > 0 && ids.has(parentId)) {
    return [parentId]
  }
  return []
}

function findCanonicalNode(nodes: QuestionNode[], id: string): QuestionNode | null {
  for (const node of nodes) {
    if (node.key === id) return node
    const found = findCanonicalNode(node.children, id)
    if (found) return found
  }
  return null
}

function subtreeContainsId(node: QuestionNode, id: string, seen = new Set<QuestionNode>()): boolean {
  if (seen.has(node)) return false
  seen.add(node)
  if (questionKey(node.question) === id) return true
  return node.children.some((child) => subtreeContainsId(child, id, seen))
}

function withParentContext(
  question: QuestionDto,
  parentId: number,
  byId: Map<number, QuestionDto>,
): QuestionDto {
  const kosul = question.bagliKosullar?.find((item) => item.parentSoruId === parentId)
  const parent = byId.get(parentId)
  return {
    ...question,
    bagliOlduguSoruId: parentId,
    bagliOlduguSoru: parent?.soruMetni?.trim() || question.bagliOlduguSoru,
    bagliAltSecenekId: kosul?.bagliAltSecenekId ?? question.bagliAltSecenekId,
    bagliKosulTipi: kosul?.bagliKosulTipi ?? question.bagliKosulTipi,
  }
}

function cloneNode(node: QuestionNode, suffix: string, questionOverride?: QuestionDto): QuestionNode {
  return {
    question: questionOverride ?? node.question,
    key: `${questionKey(node.question)}${suffix}`,
    children: node.children.map((child) => cloneNode(child, suffix)),
  }
}

function insertChildBySira(parent: QuestionNode, child: QuestionNode) {
  const index = parent.children.findIndex(
    (existing) => compareBySiraNoThenId(child.question, existing.question) < 0,
  )
  if (index < 0) parent.children.push(child)
  else parent.children.splice(index, 0, child)
}

function attachExtraParentCopies(roots: QuestionNode[], questions: QuestionDto[]) {
  const ids = new Set(questions.map((question) => numericId(question)))
  const byId = new Map(questions.map((question) => [numericId(question), question]))

  for (const question of questions) {
    const parents = parentIdsInList(question, ids)
    if (parents.length < 2) continue

    const node = findCanonicalNode(roots, questionKey(question))
    if (!node) continue

    const primaryId = question.bagliOlduguSoruId
    if (primaryId != null && primaryId > 0) {
      node.question = withParentContext(question, primaryId, byId)
    }
    for (const parentId of parents) {
      if (primaryId != null && parentId === primaryId) continue
      const parent = findCanonicalNode(roots, String(parentId))
      if (!parent || parent === node) continue
      if (subtreeContainsId(node, String(parentId))) continue
      insertChildBySira(
        parent,
        cloneNode(node, `-parent-${parentId}`, withParentContext(question, parentId, byId)),
      )
    }
  }
}

function dedupeQuestionsById(questions: QuestionDto[]): QuestionDto[] {
  const seen = new Set<string>()
  const result: QuestionDto[] = []
  for (const question of questions) {
    const key = questionKey(question)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(question)
  }
  return result
}

function flattenDisplayRows(nodes: QuestionNode[]): QuestionDisplayRow[] {
  const rows: QuestionDisplayRow[] = []

  const walk = (list: QuestionNode[], depth: number, prefix: string) => {
    list.forEach((node, index) => {
      const outline = prefix ? `${prefix}.${index + 1}` : String(index + 1)
      rows.push({
        ...node.question,
        displayKey: node.key,
        displayDepth: depth,
        displayOutline: outline,
      })
      walk(node.children, depth + 1, outline)
    })
  }

  walk(nodes, 0, '')
  return rows
}

/** Aynı soru birden fazla üst soruya bağlıysa her üst sorunun altında bir kez görünür. */
export function listQuestionDisplayRows(questions: QuestionDto[]): QuestionDisplayRow[] {
  if (questions.length === 0) return []
  const ordered = sortQuestionsForSurvey(dedupeQuestionsById(questions))
  const tree = buildQuestionTree(ordered)
  attachExtraParentCopies(tree, ordered)
  return flattenDisplayRows(tree)
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
