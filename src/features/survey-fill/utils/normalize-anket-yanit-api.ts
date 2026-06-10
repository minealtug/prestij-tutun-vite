import type {
  AnketSablonDto,
  AnketYanitOturumDto,
  AnketYanitSoruDto,
} from '../types/anket-yanit.types'

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

function readNumber(raw: unknown): number | null {
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

function readTamamlanabilir(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw
  const row = asRecord(raw)
  return Boolean(pick(row, 'tamamlanabilir', 'Tamamlanabilir', 'value', 'Value'))
}

function readCevapFields(cevapRaw: unknown) {
  const cevap = asRecord(cevapRaw)
  if (Object.keys(cevap).length === 0) {
    return { cevapText: null as string | null, ekiciId: null as string | null }
  }

  const cevapTextRaw = pick(cevap, 'cevapText', 'CevapText')
  const ekiciRaw = pick(cevap, 'ekiciId', 'EkiciId')

  return {
    cevapText: cevapTextRaw != null ? String(cevapTextRaw) : null,
    ekiciId: ekiciRaw != null ? String(ekiciRaw) : null,
  }
}

function mergeSoruMetadata(
  soru: AnketYanitSoruDto,
  metadata: Record<string, unknown> | undefined,
): AnketYanitSoruDto {
  if (!metadata) return soru

  return {
    ...soru,
    soruMetni: String(pick(metadata, 'soruMetni', 'SoruMetni') ?? soru.soruMetni),
    altSoruMetni: pick(metadata, 'altSoruMetni', 'AltSoruMetni') ?? soru.altSoruMetni,
    zorunlu: Boolean(pick(metadata, 'zorunlu', 'Zorunlu') ?? soru.zorunlu),
    bagliSoru: Boolean(pick(metadata, 'bagliSoru', 'BagliSoru') ?? soru.bagliSoru),
    cevapGirdiTipAdi: pick(metadata, 'cevapGirdiTipAdi', 'CevapGirdiTipAdi') ?? soru.cevapGirdiTipAdi,
    cevapGirdiTipId:
      readNumber(pick(metadata, 'cevapGirdiTipId', 'CevapGirdiTipId')) ?? soru.cevapGirdiTipId,
  }
}

export function mapAnketSablonFromApi(raw: unknown): AnketSablonDto | null {
  const row = asRecord(raw)
  const id = readNumber(pick(row, 'id', 'Id', 'sablonId', 'SablonId'))
  if (id == null || id <= 0) return null

  const adi = String(pick(row, 'adi', 'Adi', 'sablonAdi', 'SablonAdi', 'name', 'Name') ?? '').trim()
  const baslikId = readNumber(pick(row, 'baslikId', 'BaslikId'))

  return {
    id,
    adi: adi || `Şablon #${id}`,
    baslikId,
  }
}

export function mapAnketSablonlarFromApi(raw: unknown): AnketSablonDto[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(mapAnketSablonFromApi)
    .filter((item): item is AnketSablonDto => item !== null)
    .sort((a, b) => a.adi.localeCompare(b.adi, 'tr-TR'))
}

function resolveGorunur(
  row: Record<string, unknown>,
  soruId: number,
  yanitlandi: boolean,
  unansweredSoruIds: Set<number>,
  hasUnansweredList: boolean,
): boolean {
  const explicit = pick(row, 'gorunur', 'Gorunur')
  if (explicit !== undefined && explicit !== null) return Boolean(explicit)
  if (yanitlandi) return true
  if (hasUnansweredList) return unansweredSoruIds.has(soruId)
  return true
}

function buildUnansweredSoruIds(raw: unknown): Set<number> {
  const row = asRecord(raw)
  const yanitlanmayanRaw = pick<unknown[]>(row, 'yanitlanmayanSorular', 'YanitlanmayanSorular') ?? []
  const ids = new Set<number>()

  for (const item of yanitlanmayanRaw) {
    const metadata = asRecord(item)
    const soruId = readNumber(pick(metadata, 'id', 'Id', 'soruId', 'SoruId'))
    if (soruId != null) ids.add(soruId)
  }

  return ids
}

export function mapAnketYanitSoruFromApi(
  raw: unknown,
  metadataBySoruId?: Map<number, Record<string, unknown>>,
  unansweredSoruIds?: Set<number>,
  hasUnansweredList = false,
): AnketYanitSoruDto | null {
  const row = asRecord(raw)
  const soruId = readNumber(pick(row, 'soruId', 'SoruId', 'id', 'Id'))
  if (soruId == null || soruId <= 0) return null

  const sira = readNumber(pick(row, 'sira', 'Sira')) ?? 0
  const cevapFields = readCevapFields(pick(row, 'cevap', 'Cevap'))
  const yanitlandi = Boolean(pick(row, 'yanitlandi', 'Yanitlandi'))

  const soru: AnketYanitSoruDto = {
    soruId,
    sira,
    soruMetni: String(pick(row, 'soruMetni', 'SoruMetni') ?? ''),
    altSoruMetni: pick(row, 'altSoruMetni', 'AltSoruMetni') ?? null,
    gorunur: resolveGorunur(
      row,
      soruId,
      yanitlandi,
      unansweredSoruIds ?? new Set(),
      hasUnansweredList,
    ),
    zorunlu: Boolean(pick(row, 'zorunlu', 'Zorunlu')),
    bagliSoru: Boolean(pick(row, 'bagliSoru', 'BagliSoru')),
    cevapGirdiTipAdi: pick(row, 'cevapGirdiTipAdi', 'CevapGirdiTipAdi') ?? null,
    cevapGirdiTipId: readNumber(pick(row, 'cevapGirdiTipId', 'CevapGirdiTipId')),
    yanitlandi,
    cevapText:
      cevapFields.cevapText ??
      (pick(row, 'cevapText', 'CevapText') != null
        ? String(pick(row, 'cevapText', 'CevapText'))
        : null),
    ekiciId:
      cevapFields.ekiciId ??
      (pick(row, 'ekiciId', 'EkiciId') != null ? String(pick(row, 'ekiciId', 'EkiciId')) : null),
  }

  return mergeSoruMetadata(soru, metadataBySoruId?.get(soruId))
}

function mapYanitlanmayanSoruFromApi(raw: unknown): AnketYanitSoruDto | null {
  const row = asRecord(raw)
  const soruId = readNumber(pick(row, 'id', 'Id', 'soruId', 'SoruId'))
  if (soruId == null || soruId <= 0) return null

  return {
    soruId,
    sira: readNumber(pick(row, 'sira', 'Sira')) ?? 0,
    soruMetni: String(pick(row, 'soruMetni', 'SoruMetni') ?? ''),
    altSoruMetni: pick(row, 'altSoruMetni', 'AltSoruMetni') ?? null,
    gorunur: true,
    zorunlu: Boolean(pick(row, 'zorunlu', 'Zorunlu')),
    bagliSoru: Boolean(pick(row, 'bagliSoru', 'BagliSoru')),
    cevapGirdiTipAdi: pick(row, 'cevapGirdiTipAdi', 'CevapGirdiTipAdi') ?? null,
    cevapGirdiTipId: readNumber(pick(row, 'cevapGirdiTipId', 'CevapGirdiTipId')),
    yanitlandi: false,
    cevapText: null,
    ekiciId: null,
  }
}

function buildMetadataMap(raw: unknown): Map<number, Record<string, unknown>> {
  const row = asRecord(raw)
  const yanitlanmayanRaw = pick<unknown[]>(row, 'yanitlanmayanSorular', 'YanitlanmayanSorular') ?? []
  const metadataBySoruId = new Map<number, Record<string, unknown>>()

  for (const item of yanitlanmayanRaw) {
    const metadata = asRecord(item)
    const soruId = readNumber(pick(metadata, 'id', 'Id', 'soruId', 'SoruId'))
    if (soruId != null) metadataBySoruId.set(soruId, metadata)
  }

  return metadataBySoruId
}

function sortSorular(sorular: AnketYanitSoruDto[]) {
  return sorular.sort((a, b) => a.sira - b.sira || a.soruId - b.soruId)
}

function readMintikaIdFromList(rawList: unknown[]): number | null {
  for (const item of rawList) {
    const row = asRecord(item)
    const fromRow = readNumber(pick(row, 'mintikaId', 'MintikaId'))
    if (fromRow != null && fromRow > 0) return fromRow

    const cevapRow = asRecord(pick(row, 'cevap', 'Cevap'))
    const fromCevap = readNumber(pick(cevapRow, 'mintikaId', 'MintikaId'))
    if (fromCevap != null && fromCevap > 0) return fromCevap
  }

  return null
}

function readMintikaId(row: Record<string, unknown>, sorularRaw: unknown[]): number | null {
  const topLevel = readNumber(pick(row, 'mintikaId', 'MintikaId'))
  if (topLevel != null && topLevel > 0) return topLevel

  const yanitlananRaw = pick<unknown[]>(row, 'yanitlananSorular', 'YanitlananSorular') ?? []
  const fromYanitlanan = readMintikaIdFromList(yanitlananRaw)
  if (fromYanitlanan != null) return fromYanitlanan

  return readMintikaIdFromList(sorularRaw)
}

export function mapAnketYanitOturumFromApi(
  raw: unknown,
  tamamlanabilirRaw?: unknown,
): AnketYanitOturumDto {
  const row = asRecord(raw)
  const metadataBySoruId = buildMetadataMap(raw)
  const unansweredSoruIds = buildUnansweredSoruIds(raw)
  const hasUnansweredList = unansweredSoruIds.size > 0
  const sorularRaw = pick<unknown[]>(row, 'sorular', 'Sorular') ?? []
  const yanitlanmayanRaw = pick<unknown[]>(row, 'yanitlanmayanSorular', 'YanitlanmayanSorular') ?? []

  let sorular: AnketYanitSoruDto[]
  if (sorularRaw.length > 0) {
    sorular = sorularRaw
      .map((item) =>
        mapAnketYanitSoruFromApi(item, metadataBySoruId, unansweredSoruIds, hasUnansweredList),
      )
      .filter((item): item is AnketYanitSoruDto => item !== null)
  } else {
    sorular = yanitlanmayanRaw
      .map(mapYanitlanmayanSoruFromApi)
      .filter((item): item is AnketYanitSoruDto => item !== null)
  }

  const ekiciRaw = pick(row, 'ekiciId', 'EkiciId')
  const mintikaId = readMintikaId(row, sorularRaw)

  return {
    ekiciId: ekiciRaw != null ? String(ekiciRaw) : null,
    mintikaId,
    tamamlanabilir:
      tamamlanabilirRaw !== undefined
        ? readTamamlanabilir(tamamlanabilirRaw)
        : readTamamlanabilir(pick(row, 'tamamlanabilir', 'Tamamlanabilir')),
    sorular: sortSorular(sorular),
  }
}
