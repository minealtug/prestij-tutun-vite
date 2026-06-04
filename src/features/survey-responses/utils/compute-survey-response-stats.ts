import type { AnketCevapOzetItem } from '../types/survey-response.types'

export interface SurveyResponseStats {
  kayitSayisi: number
  yanitlananSoruSayisi: number
  yanitlanmayanSoruSayisi: number
  toplamSoruSayisi: number
  tamamlanmaYuzdesi: number | null
}

export function computeSurveyResponseStats(items: AnketCevapOzetItem[]): SurveyResponseStats {
  let yanitlananSoruSayisi = 0
  let yanitlanmayanSoruSayisi = 0

  for (const item of items) {
    yanitlananSoruSayisi += Math.max(0, item.yanitlananSoruSayisi)
    yanitlanmayanSoruSayisi += Math.max(0, item.yanitlanmayanSoruSayisi)
  }

  const toplamSoruSayisi = yanitlananSoruSayisi + yanitlanmayanSoruSayisi
  const tamamlanmaYuzdesi =
    toplamSoruSayisi > 0
      ? Math.round((yanitlananSoruSayisi / toplamSoruSayisi) * 100)
      : null

  return {
    kayitSayisi: items.length,
    yanitlananSoruSayisi,
    yanitlanmayanSoruSayisi,
    toplamSoruSayisi,
    tamamlanmaYuzdesi,
  }
}
