const STORAGE_KEY = 'prestij.survey-question-order'

export interface QuestionOrderStorage {
  get(baslikId: number): string[] | null
  set(baslikId: number, ids: string[]): void
}

function readAll(): Record<string, string[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string[]>
  } catch {
    return {}
  }
}

function writeAll(value: Record<string, string[]>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

export const questionOrderStorage: QuestionOrderStorage = {
  get(baslikId: number) {
    const ids = readAll()[String(baslikId)]
    return Array.isArray(ids) && ids.length > 0 ? ids.map(String) : null
  },
  set(baslikId: number, ids: string[]) {
    const all = readAll()
    all[String(baslikId)] = ids.map(String)
    writeAll(all)
  },
}
