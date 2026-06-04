import type { AnketCevapDto, ResponseAnswerDetail, SurveyResponseGroup } from '../types/survey-response.types'

export function formatCevapValue(row: AnketCevapDto): string {
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

type GroupAccumulator = {
  group: SurveyResponseGroup
  answersByQuestion: Map<number, { detail: ResponseAnswerDetail; answeredAt: string }>
}

export function groupAnketCevaplari(items: AnketCevapDto[]): SurveyResponseGroup[] {
  const map = new Map<string, GroupAccumulator>()

  for (const row of items) {
    const baslikId = row.baslikId ?? row.sablonId
    const key = `${row.ekiciId}|${baslikId}`
    let entry = map.get(key)
    if (!entry) {
      entry = {
        group: {
          id: key,
          ekiciId: row.ekiciId,
          baslikId,
          submittedAt: row.islemTarihi,
          username: String(row.kullaniciId),
          fullName: [row.ekiciAd, row.ekiciSoyad].filter(Boolean).join(' ').trim() || '-',
          surveyName: row.sablonAdi?.trim() || '-',
          mintikaAdi: row.mintikaAdi?.trim() || '-',
          answers: [],
        },
        answersByQuestion: new Map(),
      }
      map.set(key, entry)
    } else if (new Date(row.islemTarihi).getTime() > new Date(entry.group.submittedAt).getTime()) {
      entry.group.submittedAt = row.islemTarihi
    }

    const answer: ResponseAnswerDetail = {
      questionNo: row.soruId,
      questionText: row.soruMetni?.trim() || '-',
      answer: formatCevapValue(row),
    }
    const existing = entry.answersByQuestion.get(row.soruId)
    if (!existing || new Date(row.islemTarihi).getTime() >= new Date(existing.answeredAt).getTime()) {
      entry.answersByQuestion.set(row.soruId, {
        detail: answer,
        answeredAt: row.islemTarihi,
      })
    }
  }

  const groups = [...map.values()].map(({ group, answersByQuestion }) => {
    group.answers = [...answersByQuestion.values()]
      .map((item) => item.detail)
      .sort((a, b) => a.questionNo - b.questionNo)
    return group
  })

  return groups.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )
}
