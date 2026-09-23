export interface VisibleSoruKolonu {
  header: string
  index: number
}

function normalizeSoruHeader(header: string) {
  return header
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .replace(/[?？]/g, '')
}

/**
 * Kontrat sahibi cinsiyet / doğum tarihi / ad-soyad soruları ekici kolonlarında
 * zaten vardır; raporda ve Excel'de tekrar etmemeli.
 * Üretici (eksper) soruları gizlenmez.
 */
export function isKontratSahibiDuplicateReportColumn(header: string): boolean {
  const normalized = normalizeSoruHeader(header)
  if (!normalized.includes('kontrat sahibi')) return false

  if (normalized.includes('cinsiyet')) return true
  if (normalized.includes('doğum') || normalized.includes('dogum')) return true
  if (
    normalized.includes('ad-soyad') ||
    normalized.includes('ad soyad') ||
    normalized.includes('adsoyad') ||
    (normalized.includes('ad') && normalized.includes('soyad'))
  ) {
    return true
  }

  return false
}

export function getVisibleSoruKolonlari(soruKolonlari: string[]): VisibleSoruKolonu[] {
  return soruKolonlari.flatMap((header, index) =>
    isKontratSahibiDuplicateReportColumn(header) ? [] : [{ header, index }],
  )
}
