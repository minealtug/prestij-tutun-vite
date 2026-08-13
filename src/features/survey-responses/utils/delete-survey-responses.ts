import type {
  AnketCevapOzetItem,
  DeleteAnketCevapRequest,
  DeleteAnketCevapResult,
} from '../types/survey-response.types'
import { getOzetFullName } from '../types/survey-response.types'

const DEFAULT_DELETE_MESSAGE = 'Seçilen ekicilerin anket cevapları silindi.'
const NAME_PREVIEW_LIMIT = 5

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function pickNumber(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = Number(row[key])
    if (Number.isFinite(value)) return value
  }
  return undefined
}

function pickString(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

export function toDeleteAnketCevapRequest(row: AnketCevapOzetItem): DeleteAnketCevapRequest | null {
  const requests = toDeleteAnketCevapRequests([row])
  return requests[0] ?? null
}

export function toDeleteAnketCevapRequests(rows: AnketCevapOzetItem[]): DeleteAnketCevapRequest[] {
  const bySablon = new Map<number, Set<string>>()

  for (const row of rows) {
    if (!row.ekiciId || !Number.isFinite(row.sablonId) || row.sablonId <= 0) continue
    const ekiciIds = bySablon.get(row.sablonId) ?? new Set<string>()
    ekiciIds.add(row.ekiciId)
    bySablon.set(row.sablonId, ekiciIds)
  }

  return [...bySablon.entries()].map(([sablonId, ekiciIds]) => ({
    ekiciIds: [...ekiciIds],
    sablonId,
    soruIds: [],
  }))
}

export function getUniqueSelectedEkiciler(rows: AnketCevapOzetItem[]): {
  ekiciId: string
  fullName: string
}[] {
  const seen = new Set<string>()
  const unique: { ekiciId: string; fullName: string }[] = []

  for (const row of rows) {
    if (seen.has(row.ekiciId)) continue
    seen.add(row.ekiciId)
    unique.push({
      ekiciId: row.ekiciId,
      fullName: getOzetFullName(row),
    })
  }

  return unique
}

export function formatEkiciNamePreview(
  names: string[],
  limit = NAME_PREVIEW_LIMIT,
): { visibleNames: string[]; remainingCount: number } {
  if (names.length <= limit) {
    return { visibleNames: names, remainingCount: 0 }
  }

  return {
    visibleNames: names.slice(0, limit),
    remainingCount: names.length - limit,
  }
}

export function combineDeleteAnketCevapResults(results: DeleteAnketCevapResult[]): DeleteAnketCevapResult {
  const silinenAdet = results.reduce((sum, result) => sum + result.silinenAdet, 0)
  const message =
    results.map((result) => result.message.trim()).find(Boolean) || DEFAULT_DELETE_MESSAGE
  return { message, silinenAdet }
}

export function filterDeletedSurveyResponses<T>(
  rows: T[],
  payload: DeleteAnketCevapRequest,
): T[] {
  const ekiciIds = new Set(payload.ekiciIds)
  return rows.filter((row) => {
    if (!row || typeof row !== 'object') return true
    const item = row as { ekiciId?: string; sablonId?: number }
    if (!item.ekiciId || item.sablonId == null) return true
    return !(ekiciIds.has(item.ekiciId) && item.sablonId === payload.sablonId)
  })
}

export function filterDeletedSurveyResponsesByPayloads<T>(
  rows: T[],
  payloads: DeleteAnketCevapRequest[],
): T[] {
  return payloads.reduce((acc, payload) => filterDeletedSurveyResponses(acc, payload), rows)
}

export function mapDeleteAnketCevapResult(
  raw: unknown,
  envelopeMessage?: string,
): DeleteAnketCevapResult {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return {
      message: envelopeMessage?.trim() || DEFAULT_DELETE_MESSAGE,
      silinenAdet: raw,
    }
  }

  const row = asRecord(raw)
  const silinenAdet =
    pickNumber(
      row,
      'silinenAdet',
      'SilinenAdet',
      'silinenKayitSayisi',
      'SilinenKayitSayisi',
      'deletedCount',
      'DeletedCount',
      'count',
      'Count',
    ) ?? 0

  const message =
    pickString(row, 'message', 'Message') || envelopeMessage?.trim() || DEFAULT_DELETE_MESSAGE

  return { message, silinenAdet }
}

export function formatDeleteAnketCevapSuccessText(result: DeleteAnketCevapResult): string {
  if (result.silinenAdet > 0) {
    return `${result.message} Silinen kayıt sayısı: ${result.silinenAdet.toLocaleString('tr-TR')}.`
  }
  return result.message
}
