import type { AnketCevapDetayDto } from '@/features/survey-responses/types/survey-response.types'

export function listUnansweredQuestionTexts(detail: AnketCevapDetayDto): string[] {
  return detail.sorular
    .filter((soru) => !soru.yanitlandi)
    .sort((a, b) => a.sira - b.sira)
    .map((soru) => soru.soruMetni.trim())
    .filter(Boolean)
}
