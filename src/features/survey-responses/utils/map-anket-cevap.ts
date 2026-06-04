import type {
  AnketCevapDegerDto,
  AnketCevapOzetItem,
  AnketSoruCevapDto,
  SoruCevapDisplay,
} from '../types/survey-response.types'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'

export function formatCevapDisplay(cevap?: AnketCevapDegerDto | null): string {
  if (!cevap) return UNANSWERED_ANSWER_LABEL
  if (cevap.cevapAltSecenekAdi?.trim()) return cevap.cevapAltSecenekAdi.trim()
  if (cevap.cevapText?.trim()) return cevap.cevapText.trim()
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
