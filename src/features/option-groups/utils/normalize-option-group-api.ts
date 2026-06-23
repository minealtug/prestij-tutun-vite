import type {
  AltSecenekDto,
  SecenekGrupDto,
  SecenekGrupFormValues,
} from '../types/option-group.types'

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

export function mapAltSecenekFromApi(raw: unknown): AltSecenekDto | null {
  const row = asRecord(raw)
  const id = Number(pick(row, 'id', 'Id'))
  const secenekGrupId = Number(pick(row, 'secenekGrupId', 'SecenekGrupId'))
  if (!Number.isFinite(id) || id <= 0) return null
  if (!Number.isFinite(secenekGrupId) || secenekGrupId <= 0) return null

  const adi = String(pick(row, 'adi', 'Adi') ?? '').trim()
  if (!adi) return null

  const siraNo = Number(pick(row, 'siraNo', 'SiraNo') ?? 0)

  return {
    id,
    secenekGrupId,
    adi,
    siraNo: Number.isFinite(siraNo) ? siraNo : 0,
  }
}

function mapAltSeceneklerFromFields(raw: unknown): AltSecenekDto[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(mapAltSecenekFromApi)
    .filter((item): item is AltSecenekDto => item !== null)
    .sort((left, right) => {
      if (left.siraNo !== right.siraNo) return left.siraNo - right.siraNo
      return left.adi.localeCompare(right.adi, 'tr-TR')
    })
}

export function mapSecenekGrupFromApi(raw: unknown): SecenekGrupDto | null {
  const row = asRecord(raw)
  const secenekGrupId = Number(pick(row, 'secenekGrupId', 'SecenekGrupId', 'id', 'Id'))
  if (!Number.isFinite(secenekGrupId) || secenekGrupId <= 0) return null

  const grupAdi = String(pick(row, 'grupAdi', 'GrupAdi') ?? '').trim()
  const altSecenekler = mapAltSeceneklerFromFields(
    pick(row, 'altSecenekler', 'AltSecenekler'),
  )

  return {
    secenekGrupId,
    grupAdi,
    altSecenekler,
  }
}

export function groupAltSeceneklerIntoGruplar(altSecenekler: AltSecenekDto[]): SecenekGrupDto[] {
  const byGrup = new Map<number, AltSecenekDto[]>()

  for (const item of altSecenekler) {
    const list = byGrup.get(item.secenekGrupId) ?? []
    list.push(item)
    byGrup.set(item.secenekGrupId, list)
  }

  return [...byGrup.entries()]
    .sort(([leftId], [rightId]) => leftId - rightId)
    .map(([secenekGrupId, items]) => ({
      secenekGrupId,
      grupAdi: '',
      altSecenekler: [...items].sort((left, right) => {
        if (left.siraNo !== right.siraNo) return left.siraNo - right.siraNo
        return left.adi.localeCompare(right.adi, 'tr-TR')
      }),
    }))
    .sort((left, right) => {
      const leftLabel = formatAltSecenekNames(left.altSecenekler)
      const rightLabel = formatAltSecenekNames(right.altSecenekler)
      return leftLabel.localeCompare(rightLabel, 'tr-TR')
    })
}

export function mapSecenekGruplarFromApi(raw: unknown): SecenekGrupDto[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(mapSecenekGrupFromApi)
    .filter((item): item is SecenekGrupDto => item !== null)
    .sort((left, right) => {
      const leftLabel = left.grupAdi || formatAltSecenekNames(left.altSecenekler)
      const rightLabel = right.grupAdi || formatAltSecenekNames(right.altSecenekler)
      return leftLabel.localeCompare(rightLabel, 'tr-TR')
    })
}

export function formatAltSecenekNames(altSecenekler: AltSecenekDto[]): string {
  return altSecenekler.map((item) => item.adi).join(' / ')
}

export function getSecenekGrupDisplayName(grup: SecenekGrupDto): string {
  const grupAdi = grup.grupAdi.trim()
  if (grupAdi) return grupAdi
  const names = formatAltSecenekNames(grup.altSecenekler)
  if (names) return names
  return `Liste #${grup.secenekGrupId}`
}

export function createEmptySecenekGrupFormValues(): SecenekGrupFormValues {
  return {
    grupAdi: '',
    altSecenekler: [{ adi: '' }],
  }
}

export function secenekGrupToFormValues(grup: SecenekGrupDto): SecenekGrupFormValues {
  return {
    grupAdi: grup.grupAdi,
    altSecenekler:
      grup.altSecenekler.length > 0
        ? grup.altSecenekler.map((item) => ({ id: item.id, adi: item.adi }))
        : [{ adi: '' }],
  }
}

export function formValuesToAltSecenekInputs(
  values: SecenekGrupFormValues,
): { adi: string; siraNo: number }[] {
  return values.altSecenekler
    .map((item) => item.adi.trim())
    .filter((adi) => adi.length > 0)
    .map((adi, index) => ({
      adi,
      siraNo: index + 1,
    }))
}

export function formValuesToAltSecenekUpdateInputs(
  values: SecenekGrupFormValues,
): { id?: number; adi: string; siraNo: number }[] {
  return values.altSecenekler
    .map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      adi: item.adi.trim(),
    }))
    .filter((item) => item.adi.length > 0)
    .map((item, index) => ({
      ...item,
      siraNo: index + 1,
    }))
}