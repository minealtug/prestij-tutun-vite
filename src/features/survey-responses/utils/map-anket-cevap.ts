import type {
  AnketCevapDegerDto,
  AnketCevapGrupDto,
  AnketSoruCevapDto,
  ResponseAnswerDetail,
  SurveyResponseGroup,
  YanitlanmayanSoruDto,
} from '../types/survey-response.types'
import { UNANSWERED_ANSWER_LABEL } from '../types/survey-response.types'
import { getBagliOlduguSoruText } from './normalize-survey-response-api'

export function formatCevapValue(row: AnketCevapDegerDto): string {
  if (row.cevapText?.trim()) return row.cevapText.trim()
  if (row.cevapAltSecenekAdi?.trim()) return row.cevapAltSecenekAdi.trim()
  if (row.cevapNumeric != null) return String(row.cevapNumeric)
  if (row.cevapDatetime) {
    return new Date(row.cevapDatetime).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return '-'
}

function buildUnansweredMetaMap(
  sorular: YanitlanmayanSoruDto[],
): Map<number, YanitlanmayanSoruDto> {
  const map = new Map<number, YanitlanmayanSoruDto>()
  for (const soru of sorular) {
    map.set(soru.id, soru)
  }
  return map
}

function resolveBagliMeta(
  soru?: Pick<AnketSoruCevapDto, 'bagliSoru' | 'zorunlu' | 'altSoruMetni'>,
  unansweredMeta?: YanitlanmayanSoruDto,
): Pick<
  ResponseAnswerDetail,
  'bagliSoru' | 'bagliOlduguSoruId' | 'bagliOlduguSoruText' | 'zorunlu' | 'altSoruMetni'
> {
  const bagliSoru = Boolean(soru?.bagliSoru ?? unansweredMeta?.bagliSoru)
  const bagliOlduguSoruId = unansweredMeta?.bagliOlduguSoruId ?? null
  const bagliOlduguSoruText = unansweredMeta ? getBagliOlduguSoruText(unansweredMeta) : null

  return {
    bagliSoru,
    bagliOlduguSoruId,
    bagliOlduguSoruText,
    zorunlu: unansweredMeta?.zorunlu ?? soru?.zorunlu,
    altSoruMetni: unansweredMeta?.altSoruMetni ?? soru?.altSoruMetni ?? null,
  }
}

function mapSoruToAnswer(
  soru: AnketSoruCevapDto,
  unansweredMeta?: YanitlanmayanSoruDto,
): ResponseAnswerDetail {
  const isUnanswered = !soru.yanitlandi
  return {
    questionNo: soru.sira,
    soruId: soru.soruId,
    questionText: soru.soruMetni?.trim() || '-',
    answer: isUnanswered
      ? UNANSWERED_ANSWER_LABEL
      : soru.cevap
        ? formatCevapValue(soru.cevap)
        : UNANSWERED_ANSWER_LABEL,
    isUnanswered,
    ...resolveBagliMeta(soru, unansweredMeta),
  }
}

function buildAnswersFromSorular(grup: AnketCevapGrupDto): ResponseAnswerDetail[] {
  const unansweredMeta = buildUnansweredMetaMap(grup.yanitlanmayanSorular)
  const answers = grup.sorular.map((soru) =>
    mapSoruToAnswer(soru, unansweredMeta.get(soru.soruId)),
  )
  const coveredSoruIds = new Set(grup.sorular.map((soru) => soru.soruId))
  let nextSira =
    grup.sorular.reduce((max, soru) => Math.max(max, soru.sira), 0) + 1

  for (const soru of grup.yanitlanmayanSorular) {
    if (coveredSoruIds.has(soru.id)) continue
    answers.push({
      questionNo: nextSira,
      soruId: soru.id,
      questionText: soru.soruMetni?.trim() || '-',
      answer: UNANSWERED_ANSWER_LABEL,
      isUnanswered: true,
      ...resolveBagliMeta(undefined, soru),
    })
    nextSira += 1
  }

  return answers.sort((a, b) => a.questionNo - b.questionNo)
}

function buildAnswersFromFallback(grup: AnketCevapGrupDto): ResponseAnswerDetail[] {
  const answered = grup.yanitlananSorular.map((cevap) => ({
    questionNo: cevap.soruId,
    soruId: cevap.soruId,
    questionText: cevap.soruMetni?.trim() || '-',
    answer: formatCevapValue(cevap),
    isUnanswered: false,
    bagliSoru: false,
    bagliOlduguSoruId: null,
    bagliOlduguSoruText: null,
    altSoruMetni: null,
    zorunlu: undefined,
  }))

  const unanswered = grup.yanitlanmayanSorular.map((soru, index) => ({
    questionNo: index + answered.length + 1,
    soruId: soru.id,
    questionText: soru.soruMetni?.trim() || '-',
    answer: UNANSWERED_ANSWER_LABEL,
    isUnanswered: true,
    ...resolveBagliMeta(undefined, soru),
  }))

  return [...answered, ...unanswered].sort((a, b) => a.questionNo - b.questionNo)
}

export function mapAnketCevapGrupToSurveyGroup(grup: AnketCevapGrupDto): SurveyResponseGroup {
  const answers =
    grup.sorular.length > 0 ? buildAnswersFromSorular(grup) : buildAnswersFromFallback(grup)

  const surveyName = grup.baslikAdi?.trim() || grup.sablonAdi?.trim() || '-'
  const fullName = [grup.ekiciAd, grup.ekiciSoyad].filter(Boolean).join(' ').trim() || '-'

  return {
    id: `${grup.ekiciId}|${grup.baslikId}`,
    ekiciId: grup.ekiciId,
    baslikId: grup.baslikId,
    submittedAt: grup.sonIslemTarihi,
    fullName,
    surveyName,
    mintikaAdi: grup.mintikaAdi?.trim() || '-',
    yanitlananSoruSayisi: grup.yanitlananSoruSayisi,
    yanitlanmayanSoruSayisi: grup.yanitlanmayanSoruSayisi,
    answers,
  }
}

export function mapAnketCevapListFromApi(items: AnketCevapGrupDto[]): SurveyResponseGroup[] {
  return items
    .map(mapAnketCevapGrupToSurveyGroup)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
}

export function resolveParentQuestionText(
  answer: ResponseAnswerDetail,
  allAnswers: ResponseAnswerDetail[],
): string | null {
  if (!answer.bagliSoru) return null
  if (answer.bagliOlduguSoruText) return answer.bagliOlduguSoruText
  if (answer.bagliOlduguSoruId != null) {
    const parent = allAnswers.find((item) => item.soruId === answer.bagliOlduguSoruId)
    if (parent) return parent.questionText
    return `#${answer.bagliOlduguSoruId}`
  }
  return null
}
