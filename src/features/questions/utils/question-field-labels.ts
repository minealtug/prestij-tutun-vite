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

export const GOSTERILECEK_SECENEKLER_LABEL = 'Anket doldurmada gösterilecek seçenekler'
export const GOSTERILECEK_SECENEKLER_LOADING = 'Seçenekler yükleniyor...'
export const GOSTERILECEK_SECENEKLER_NEED_GRUP = 'Önce cevap seçenekleri listesini seçin'
export const GOSTERILECEK_SECENEKLER_EMPTY = 'Bu gruba ait alt seçenek bulunamadı'

export function getBagliSoruTriggerLabel(parentSecenekGrupLabel?: string): string {
  const trimmed = parentSecenekGrupLabel?.trim()
  if (!trimmed) return BAGLI_SORU_TRIGGER_LABEL
  return `Üst soruda seçilecek cevap (${trimmed})`
}

export function formatSecenekGrupOptionLabel(secenekGrupId: number, optionNames: string): string {
  const names = optionNames.trim()
  if (names) return names
  return `Liste #${secenekGrupId}`
}
