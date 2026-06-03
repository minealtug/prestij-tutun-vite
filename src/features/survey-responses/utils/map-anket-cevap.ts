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

export function groupAnketCevaplari(items: AnketCevapDto[]): SurveyResponseGroup[] {
  const map = new Map<string, SurveyResponseGroup>()

  for (const row of items) {
    const key = `${row.ekiciId}|${row.islemTarihi}|${row.sablonId}`
    let group = map.get(key)
    if (!group) {
      group = {
        id: key,
        submittedAt: row.islemTarihi,
        username: String(row.kullaniciId),
        fullName: [row.ekiciAd, row.ekiciSoyad].filter(Boolean).join(' ').trim() || '-',
        surveyName: row.sablonAdi?.trim() || '-',
        mintikaAdi: row.mintikaAdi?.trim() || '-',
        answers: [],
      }
      map.set(key, group)
    }

    const answer: ResponseAnswerDetail = {
      questionNo: row.soruId,
      questionText: row.soruMetni?.trim() || '-',
      answer: formatCevapValue(row),
    }
    group.answers.push(answer)
  }

  const groups = [...map.values()]
  for (const group of groups) {
    group.answers.sort((a, b) => a.questionNo - b.questionNo)
  }

  return groups.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )
}
