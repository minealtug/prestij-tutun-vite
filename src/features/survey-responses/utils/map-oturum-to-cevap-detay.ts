import type { AnketYanitOturumDto } from '@/features/survey-fill/types/anket-yanit.types'
import type { AnketCevapDetayDto } from '../types/survey-response.types'
import { formatCevapDisplay } from './map-anket-cevap'

export function mapOturumToCevapDetay(oturum: AnketYanitOturumDto): AnketCevapDetayDto {
  const sorular = oturum.sorular
    .filter((soru) => soru.gorunur !== false)
    .map((soru) => {
      const selectedIds =
        (soru.cevapAltSecenekIds?.length ?? 0) > 0
          ? soru.cevapAltSecenekIds!
          : soru.cevapAltSecenekId != null
            ? [soru.cevapAltSecenekId]
            : []
      const cevapAltSecenekAdlari = selectedIds
        .map((id) => soru.altSecenekler.find((option) => option.id === id)?.adi?.trim() ?? '')
        .filter(Boolean)
      const cevapAltSecenekAdi = cevapAltSecenekAdlari[0] ?? null

      const cevapPayload =
        soru.yanitlandi && (soru.cevapText || cevapAltSecenekAdlari.length > 0)
          ? {
              cevapText: soru.cevapText,
              cevapAltSecenekAdi,
              cevapAltSecenekAdlari,
              cevapAltSecenekIds: selectedIds,
            }
          : null

      const cevap = cevapPayload
        ? {
            ...cevapPayload,
            cevapGosterimMetni: formatCevapDisplay(cevapPayload),
          }
        : null

      return {
        sira: soru.sira,
        soruId: soru.soruId,
        soruMetni: soru.soruMetni,
        altSoruMetni: soru.altSoruMetni,
        bagliSoru: soru.bagliSoru,
        bagliOlduguSoruId: soru.bagliOlduguSoruId,
        bagliAltSecenekId: soru.bagliAltSecenekId,
        yanitlandi: soru.yanitlandi,
        cevap,
      }
    })

  return {
    sorular,
    yanitlanmayanSoruSayisi: sorular.filter((soru) => !soru.yanitlandi).length,
  }
}
