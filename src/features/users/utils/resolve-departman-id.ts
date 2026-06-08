import { apiClient } from '@/lib/api/api-client'
import { mapDepartmanAdiFromApi } from './normalize-user-lookups'

function readDepartmanId(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = row.id ?? row.Id
  const num = Number(id)
  return Number.isFinite(num) && num > 0 ? num : null
}

async function findDepartmanIdByAdi(adi: string): Promise<number | null> {
  const raw = await apiClient.get<unknown[]>('/api/Departman')
  if (!Array.isArray(raw)) return null

  const normalized = adi.trim().toLocaleLowerCase('tr-TR')
  for (const row of raw) {
    const rowAdi = mapDepartmanAdiFromApi(row)
    if (rowAdi?.toLocaleLowerCase('tr-TR') !== normalized) continue

    const id = readDepartmanId(row)
    if (id != null) return id
  }

  return null
}

export async function resolveDepartmanId(adi: string): Promise<number | null> {
  const trimmed = adi.trim()
  if (!trimmed) return null

  const existingId = await findDepartmanIdByAdi(trimmed)
  if (existingId != null) return existingId

  try {
    const created = await apiClient.post<unknown>('/api/Departman', { adi: trimmed, aktif: true })
    return readDepartmanId(created)
  } catch {
    return findDepartmanIdByAdi(trimmed)
  }
}
