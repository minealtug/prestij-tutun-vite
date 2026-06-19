export type BagliKosulTipi = 'esit' | 'buyuk_esit'

export const BAGLI_KOSUL_ESIT: BagliKosulTipi = 'esit'
export const BAGLI_KOSUL_BUYUK_ESIT: BagliKosulTipi = 'buyuk_esit'

export const BAGLI_KOSUL_TIPI_OPTIONS: { value: BagliKosulTipi; label: string }[] = [
  { value: BAGLI_KOSUL_ESIT, label: 'Sadece seçilen cevap' },
  { value: BAGLI_KOSUL_BUYUK_ESIT, label: 'Seçilen cevap ve üzeri' },
]

export function normalizeBagliKosulTipi(value: unknown): BagliKosulTipi {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === BAGLI_KOSUL_BUYUK_ESIT || raw === 'buyuk esit' || raw === '>=') {
    return BAGLI_KOSUL_BUYUK_ESIT
  }
  return BAGLI_KOSUL_ESIT
}

export function isBuyukEsitKosul(value: unknown): boolean {
  return normalizeBagliKosulTipi(value) === BAGLI_KOSUL_BUYUK_ESIT
}

export function getBagliKosulTipiLabel(value: unknown): string {
  return (
    BAGLI_KOSUL_TIPI_OPTIONS.find((option) => option.value === normalizeBagliKosulTipi(value))
      ?.label ?? 'Sadece seçilen cevap'
  )
}
