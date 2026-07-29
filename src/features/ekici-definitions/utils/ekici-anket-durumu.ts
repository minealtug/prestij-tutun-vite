export const DEFAULT_EKICILERIM_ANKET_BASLIK_ID = '8'

export type EkiciAnketDurumu = 'none' | 'not_started' | 'in_progress' | 'completed'

export function resolveEkiciAnketDurumu(
  yanitlananSoruSayisi: number | null,
  yanitlanmayanSoruSayisi: number | null,
  anketSelected: boolean,
): EkiciAnketDurumu {
  if (!anketSelected || yanitlananSoruSayisi == null || yanitlanmayanSoruSayisi == null) {
    return 'none'
  }

  const yanitlanan = Math.max(0, yanitlananSoruSayisi)
  const yanitlanmayan = Math.max(0, yanitlanmayanSoruSayisi)

  if (yanitlanan > 0 && yanitlanmayan === 0) {
    return 'completed'
  }

  if (yanitlanan > 0 && yanitlanmayan > 0) {
    return 'in_progress'
  }

  return 'not_started'
}

export function getEkiciAnketRowClassName(durum: EkiciAnketDurumu): string | undefined {
  if (durum === 'completed') {
    return 'app-table-row--completed'
  }

  if (durum === 'in_progress') {
    return 'app-table-row--in-progress'
  }

  if (durum === 'not_started') {
    return 'app-table-row--not-started'
  }

  return undefined
}
