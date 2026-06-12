import type { AnketYanitOturumDto } from '@/features/survey-fill/types/anket-yanit.types'
import type { AnketCevapDetayDto } from '../types/survey-response.types'

export function mapOturumToCevapDetay(oturum: AnketYanitOturumDto): AnketCevapDetayDto {
  const sorular = oturum.sorular
    .filter((soru) => soru.gorunur !== false)
    .map((soru) => {
      const cevapAltSecenekAdi =
        soru.cevapAltSecenekId != null
          ? soru.altSecenekler.find((option) => option.id === soru.cevapAltSecenekId)?.adi ??
            null
          : null

      return {
        sira: soru.sira,
        soruId: soru.soruId,
        soruMetni: soru.soruMetni,
        altSoruMetni: soru.altSoruMetni,
        bagliSoru: soru.bagliSoru,
        yanitlandi: soru.yanitlandi,
        cevap:
          soru.yanitlandi && (soru.cevapText || cevapAltSecenekAdi)
            ? {
                cevapText: soru.cevapText,
                cevapAltSecenekAdi,
              }
            : null,
      }
    })

  return {
    sorular,
    yanitlanmayanSoruSayisi: sorular.filter((soru) => !soru.yanitlandi).length,
  }
}
