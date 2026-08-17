import type { QuestionDto } from '../types/question.types'

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function readAltSecenekIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []

  const seen = new Set<number>()
  const ids: number[] = []

  for (const item of raw) {
    const id = Number(item)
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }

  return ids
}

export function mapQuestionFromApi(raw: unknown): QuestionDto {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const cevapGirdiTip = pick<Record<string, unknown>>(row, 'cevapGirdiTip', 'CevapGirdiTip')
  const anketCevapBirim = pick<Record<string, unknown>>(row, 'anketCevapBirim', 'AnketCevapBirim')

  const secenekGrupRaw = pick(row, 'secenekGrupId', 'SecenekGrupId')
  const secenekGrupNum = Number(secenekGrupRaw)
  const siraNoRaw = Number(pick(row, 'siraNo', 'SiraNo', 'sira', 'Sira') ?? 0)
  const siraNo = Number.isFinite(siraNoRaw) && siraNoRaw > 0 ? siraNoRaw : null

  return {
    id: pick(row, 'id', 'Id') as string | number,
    baslikId: Number(pick(row, 'baslikId', 'BaslikId') ?? 0),
    baslikAdi: String(pick(row, 'baslikAdi', 'BaslikAdi') ?? ''),
    cevapGirdiTipAdi: pick(row, 'cevapGirdiTipAdi', 'CevapGirdiTipAdi') as string | undefined,
    cevapGirdiTipId: Number(pick(row, 'cevapGirdiTipId', 'CevapGirdiTipId') ?? cevapGirdiTip?.id) || undefined,
    cevapGirdiTip: cevapGirdiTip
      ? {
          id: Number(cevapGirdiTip.id ?? cevapGirdiTip.Id) || undefined,
          adi: String(cevapGirdiTip.adi ?? cevapGirdiTip.Adi ?? ''),
        }
      : null,
    soruMetni: String(pick(row, 'soruMetni', 'SoruMetni') ?? ''),
    altSoruMetni: (pick(row, 'altSoruMetni', 'AltSoruMetni') as string | null) ?? null,
    zorunlu: Boolean(pick(row, 'zorunlu', 'Zorunlu')),
    aktif: Boolean(pick(row, 'aktif', 'Aktif')),
    secenekGrupId:
      Number.isFinite(secenekGrupNum) && secenekGrupNum > 0 ? secenekGrupNum : null,
    altSecenekIds: readAltSecenekIds(pick(row, 'altSecenekIds', 'AltSecenekIds')),
    bagliSoru: Boolean(pick(row, 'bagliSoru', 'BagliSoru')),
    bagliOlduguSoruId:
      Number(pick(row, 'bagliOlduguSoruId', 'BagliOlduguSoruId')) || undefined,
    bagliAltSecenekId:
      Number(pick(row, 'bagliAltSecenekId', 'BagliAltSecenekId')) || undefined,
    bagliKosulTipi: (pick(row, 'bagliKosulTipi', 'BagliKosulTipi') as string | null) ?? null,
    bagliOlduguSoru: pick(row, 'bagliOlduguSoru', 'BagliOlduguSoru'),
    anketCevapBirimId:
      Number(pick(row, 'anketCevapBirimId', 'AnketCevapBirimId') ?? anketCevapBirim?.id) ||
      undefined,
    anketCevapBirimAdi: pick(row, 'anketCevapBirimAdi', 'AnketCevapBirimAdi') as string | undefined,
    anketCevapBirim: anketCevapBirim
      ? {
          id: Number(anketCevapBirim.id ?? anketCevapBirim.Id) || undefined,
          adi: String(anketCevapBirim.adi ?? anketCevapBirim.Adi ?? ''),
        }
      : null,
    siraNo,
    kaynak: (pick(row, 'kaynak', 'Kaynak') as QuestionDto['kaynak']) ?? undefined,
  }
}

export function mapQuestionsFromApi(raw: unknown): QuestionDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapQuestionFromApi)
}
