export const DEFAULT_EKICILERIM_ANKET_BASLIK_ID = '8'

export type EkiciAnketDurumu = 'none' | 'not_started' | 'in_progress' | 'completed'

/**
 * Anket durumu.
 * Not: Taslak kayıtlarda API bazen yanitlanmayan=0 döndürür; bu durumda
 * minCompletedAnswerCount ile zorunlu soru eşiği kontrol edilir.
 */
export function resolveEkiciAnketDurumu(
  yanitlananSoruSayisi: number | null,
  yanitlanmayanSoruSayisi: number | null,
  anketSelected: boolean,
  minCompletedAnswerCount?: number,
): EkiciAnketDurumu {
  if (!anketSelected || yanitlananSoruSayisi == null || yanitlanmayanSoruSayisi == null) {
    return 'none'
  }

  const yanitlanan = Math.max(0, yanitlananSoruSayisi)
  const yanitlanmayan = Math.max(0, yanitlanmayanSoruSayisi)

  if (yanitlanan > 0 && yanitlanmayan === 0) {
    if (
      minCompletedAnswerCount != null &&
      minCompletedAnswerCount > 0 &&
      yanitlanan < minCompletedAnswerCount
    ) {
      return 'in_progress'
    }
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

export function countAnketRootZorunluSorular(
  questions: Array<{ aktif: boolean; bagliSoru: boolean; zorunlu: boolean }>,
): number {
  return questions.filter((question) => question.aktif && !question.bagliSoru && question.zorunlu)
    .length
}
