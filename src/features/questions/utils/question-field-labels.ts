import type { BagliKosulTipi } from './bagli-kosul-tipi'
import { BAGLI_KOSUL_BUYUK_ESIT, BAGLI_KOSUL_ESIT } from './bagli-kosul-tipi'

export const SECENEK_GRUP_LABEL = 'Cevap seçenekleri'
export const SECENEK_GRUP_LINKED_LABEL = 'Bu sorunun cevap seçenekleri'
export const SECENEK_GRUP_PLACEHOLDER = 'Cevap seçeneklerini seçin'
export const SECENEK_GRUP_LOADING = 'Cevap seçenekleri yükleniyor...'

export const BAGLI_SORU_TRIGGER_LABEL = 'Üst soruda hangi cevap seçilince görünsün?'
export const GORUNME_KOSULU_LABEL = 'Görünme koşulu'
export const GORUNME_KOSULU_TABLE_HEADER = 'GÖRÜNME KOŞULU'

export const ALT_SECENEK_LABEL = 'Cevap seçeneği'
export const ALT_SECENEK_LOADING = 'Seçenekler yükleniyor...'
export const ALT_SECENEK_NEED_SECENEK_GRUP = 'Önce cevap seçenekleri listesini seçin'

export function getBagliSoruTriggerLabel(parentSecenekGrupLabel?: string): string {
  const trimmed = parentSecenekGrupLabel?.trim()
  if (!trimmed) return BAGLI_SORU_TRIGGER_LABEL
  return `Üst soruda seçilecek cevap (${trimmed})`
}

export function getBagliSoruVisibilityHint(
  parentSecenekGrupLabel: string | undefined,
  bagliKosulTipi: BagliKosulTipi | string,
  options?: { linkedExisting?: boolean },
): string {
  const listeAdi = parentSecenekGrupLabel?.trim() || 'üst sorunun cevap listesinden'
  const subject = options?.linkedExisting ? 'Bağlanacak soru' : 'Bu soru'

  const kosul =
    bagliKosulTipi === BAGLI_KOSUL_BUYUK_ESIT
      ? 'Seçilen cevap ve üzerindeki değerler verildiğinde görünür (ör. 2 seçilince 1 ve 2 için tanımlı sorular birlikte açılır).'
      : 'Yalnızca seçilen cevap verildiğinde görünür.'

  return `${subject}, üst soruda "${listeAdi}" listesinden cevap verildiğinde görünür. ${kosul}`
}

export function formatSecenekGrupOptionLabel(secenekGrupId: number, optionNames: string): string {
  const names = optionNames.trim()
  if (names) return names
  return `Liste #${secenekGrupId}`
}
