import type { LinkedChildDraft } from '../components/LinkedChildEditor'
import type { CreateLinkedQuestionPayload } from '../types/question.types'
import { BAGLI_KOSUL_ESIT, normalizeBagliKosulTipi } from './bagli-kosul-tipi'
import { needsSecenekGrup } from './needs-secenek-grup'

type AnswerInputType = { id: number; adi: string }

export function mapLinkedChildren(
  children: LinkedChildDraft[],
  parentSecenekGrupId: number | undefined,
  answerInputTypes: AnswerInputType[],
  setError: (message: string) => void,
): CreateLinkedQuestionPayload[] | null {
  const mapped: CreateLinkedQuestionPayload[] = []

  for (const child of children) {
    const result = mapLinkedChild(child, parentSecenekGrupId, answerInputTypes, setError)
    if (!result) return null
    mapped.push(result)
  }

  return mapped
}

function mapLinkedChild(
  child: LinkedChildDraft,
  parentSecenekGrupId: number | undefined,
  answerInputTypes: AnswerInputType[],
  setError: (message: string) => void,
): CreateLinkedQuestionPayload | null {
  const cevapGirdiTipId = Number(child.cevapGirdiTipId)
  const soruMetni = child.soruMetni.trim()
  const parsedSecenekGrupId = Number(child.secenekGrupId)
  const secenekGrupId =
    Number.isFinite(parsedSecenekGrupId) && parsedSecenekGrupId > 0 ? parsedSecenekGrupId : undefined
  const parsedBagliAltSecenekId = Number(child.bagliAltSecenekId)
  const bagliAltSecenekId =
    Number.isFinite(parsedBagliAltSecenekId) && parsedBagliAltSecenekId > 0
      ? parsedBagliAltSecenekId
      : undefined
  const parsedAnketCevapBirimId = Number(child.anketCevapBirimId)
  const anketCevapBirimId =
    Number.isFinite(parsedAnketCevapBirimId) && parsedAnketCevapBirimId > 0
      ? parsedAnketCevapBirimId
      : undefined

  if (!Number.isFinite(cevapGirdiTipId) || cevapGirdiTipId <= 0) {
    setError('Bağlı sorular için geçerli cevap tipi seçin.')
    return null
  }
  if (!soruMetni) {
    setError('Bağlı soru metni boş olamaz.')
    return null
  }

  const answerType = answerInputTypes.find((item) => item.id === cevapGirdiTipId)
  if (answerType && needsSecenekGrup(answerType.adi) && !secenekGrupId) {
    setError('Bağlı sorular için seçenek grubu seçmelisiniz.')
    return null
  }

  if (parentSecenekGrupId && !bagliAltSecenekId) {
      setError(
        `"${soruMetni}" için üst sorunun cevap seçeneklerinden hangi cevabın bu soruyu açacağını seçmelisiniz.`,
      )
    return null
  }

  let nestedChildren: CreateLinkedQuestionPayload[] | undefined
  if (child.children.length > 0) {
    const nested = mapLinkedChildren(child.children, secenekGrupId, answerInputTypes, setError)
    if (!nested) return null
    nestedChildren = nested
  }

  return {
    cevapGirdiTipId,
    soruMetni,
    zorunlu: child.zorunlu,
    aktif: child.aktif,
    ...(secenekGrupId ? { secenekGrupId } : {}),
    ...(anketCevapBirimId ? { anketCevapBirimId } : {}),
    ...(bagliAltSecenekId ? { bagliAltSecenekId } : {}),
    ...(child.bagliKosulTipi
      ? { bagliKosulTipi: normalizeBagliKosulTipi(child.bagliKosulTipi) }
      : { bagliKosulTipi: BAGLI_KOSUL_ESIT }),
    ...(nestedChildren ? { bagliSorular: nestedChildren } : {}),
  }
}
