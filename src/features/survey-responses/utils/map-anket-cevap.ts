import type {
  AnketCevapDegerDto,
  AnketCevapOzetItem,
  AnketSoruCevapDto,
  SoruCevapDisplay,
} from '../types/survey-response.types'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'

function formatCevapDatetime(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null

  const day = date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const hasTime =
    trimmed.includes('T') &&
    !/T00:00(?::00)?(?:\.\d+)?(?:Z)?$/i.test(trimmed) &&
    !(date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0)

  if (!hasTime) return day

  const time = date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${day} ${time}`
}

function looksLikeIsoDatetime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value.trim())
}

function uniqueCevapAdlari(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const value of values) {
    const text = value?.trim() ?? ''
    if (!text) continue
    const key = text.toLocaleLowerCase('tr-TR')
    if (seen.has(key)) continue
    seen.add(key)
    names.push(text)
  }
  return names
}

export function formatCevapDisplay(cevap?: AnketCevapDegerDto | null): string {
  if (!cevap) return UNANSWERED_ANSWER_LABEL

  const text = cevap.cevapText?.trim() ?? ''
  const secenekAdlari = uniqueCevapAdlari([
    ...(cevap.cevapAltSecenekAdlari ?? []),
    cevap.cevapAltSecenekAdi,
  ])
  if (secenekAdlari.length > 1) return secenekAdlari.join(', ')
  if (secenekAdlari.length === 1) return secenekAdlari[0]

  const gosterim = cevap.cevapGosterimMetni?.trim()
  if (gosterim && !(gosterim === '0' && !text)) return gosterim

  const datetimeRaw = cevap.cevapDatetime?.trim()
  if (datetimeRaw) {
    return formatCevapDatetime(datetimeRaw) ?? datetimeRaw
  }

  if (text) {
    if (looksLikeIsoDatetime(text)) {
      return formatCevapDatetime(text) ?? text
    }
    return text
  }

  if (
    cevap.cevapNumeric != null &&
    Number.isFinite(cevap.cevapNumeric) &&
    cevap.cevapNumeric !== 0
  ) {
    return String(cevap.cevapNumeric)
  }

  return UNANSWERED_ANSWER_LABEL
}

function mapSoruToDisplay(soru: AnketSoruCevapDto): SoruCevapDisplay {
  return {
    soruId: soru.soruId,
    sira: soru.sira,
    soruMetni: soru.soruMetni?.trim() || '-',
    altSoruMetni: soru.altSoruMetni?.trim() || null,
    yanitlandi: soru.yanitlandi,
    cevapMetni: soru.yanitlandi ? formatCevapDisplay(soru.cevap) : UNANSWERED_ANSWER_LABEL,
    bagliSoru: Boolean(soru.bagliSoru),
    bagliAltSecenekId: soru.bagliAltSecenekId ?? null,
    children: [],
  }
}

export function buildSoruCevapTree(sorular: AnketSoruCevapDto[]): SoruCevapDisplay[] {
  const sorted = [...sorular].sort((a, b) => a.sira - b.sira)
  const bySoruId = new Map<number, SoruCevapDisplay>()
  const roots: SoruCevapDisplay[] = []

  for (const soru of sorted) {
    bySoruId.set(soru.soruId, mapSoruToDisplay(soru))
  }

  for (let i = 0; i < sorted.length; i += 1) {
    const soru = sorted[i]
    const node = bySoruId.get(soru.soruId)
    if (!node) continue

    if (soru.bagliSoru) {
      const parentId = soru.bagliOlduguSoruId
      const parentById = parentId != null ? bySoruId.get(parentId) : undefined
      const parentByOrder = i > 0 ? bySoruId.get(sorted[i - 1].soruId) : undefined
      const parent = parentById ?? parentByOrder

      if (parent) {
        parent.children.push(node)
        continue
      }
    }

    roots.push(node)
  }

  return roots
}

export function sortAnketCevapOzetList(items: AnketCevapOzetItem[]): AnketCevapOzetItem[] {
  return [...items].sort(
    (a, b) => new Date(b.sonIslemTarihi).getTime() - new Date(a.sonIslemTarihi).getTime(),
  )
}

export interface FlatSoruCevapRow {
  soruId: number
  kategori: string
  soruMetni: string
  cevapMetni: string
  yanitlandi: boolean
}

function flattenSoruNode(
  soru: SoruCevapDisplay,
  kategori: string,
  rows: FlatSoruCevapRow[],
) {
  rows.push({
    soruId: soru.soruId,
    kategori,
    soruMetni: soru.soruMetni,
    cevapMetni: soru.cevapMetni,
    yanitlandi: soru.yanitlandi,
  })

  for (const child of soru.children) {
    flattenSoruNode(child, kategori, rows)
  }
}

export function flattenSoruCevapTree(
  sorular: SoruCevapDisplay[],
  defaultKategori = 'Genel',
): FlatSoruCevapRow[] {
  const rows: FlatSoruCevapRow[] = []
  for (const soru of sorular) {
    flattenSoruNode(soru, defaultKategori, rows)
  }
  return rows
}

export function formatSonIslemTarihi(iso: string): string {
  if (!iso?.trim()) return '-'
  const trimmed = iso.trim()
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return '-'

  const day = date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const hasNoMeaningfulTime =
    !trimmed.includes('T') ||
    /T00:00(?::00)?(?:\.\d+)?(?:Z)?$/i.test(trimmed) ||
    (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0)

  if (hasNoMeaningfulTime) return day

  const time = date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${day} ${time}`
}

export function getSurveyResponseRowClassName(
  item: Pick<AnketCevapOzetItem, 'yanitlananSoruSayisi' | 'yanitlanmayanSoruSayisi'>,
): string | undefined {
  const answered = Math.max(0, item.yanitlananSoruSayisi)
  const unanswered = Math.max(0, item.yanitlanmayanSoruSayisi)

  if (unanswered === 0 && answered > 0) {
    return 'app-table-row--completed'
  }

  if (answered > 0 && unanswered > 0) {
    return 'app-table-row--in-progress'
  }

  return undefined
}
