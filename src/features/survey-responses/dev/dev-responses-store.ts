import { devSurveysStore } from '@/features/surveys/dev/dev-surveys-store'
import type { SurveyResponseDto, SurveyResponsesQueryParams } from '../types/survey-response.types'

const STORAGE_KEY = 'prestij-dev-survey-responses'

const SEED: SurveyResponseDto[] = [
  {
    id: 'resp-1',
    submittedAt: '2026-05-20T14:32:00.000Z',
    username: 'admin',
    fullName: 'Test Admin',
    surveyId: 'seed-1',
    surveyName: 'Sezon Sonu Anketi',
    answers: [
      { questionNo: 1, questionText: 'Genel memnuniyetiniz?', answer: 'Çok memnunum' },
      { questionNo: 2, questionText: 'Ürün kalitesi hakkında görüşünüz', answer: 'Kalite standartların üzerinde' },
      { questionNo: 3, questionText: 'Tekrar tercih eder misiniz?', answer: 'Evet' },
    ],
  },
  {
    id: 'resp-2',
    submittedAt: '2026-05-19T09:15:00.000Z',
    username: 'musteri01',
    fullName: 'Ayşe Yılmaz',
    surveyId: 'seed-1',
    surveyName: 'Sezon Sonu Anketi',
    answers: [
      { questionNo: 1, questionText: 'Genel memnuniyetiniz?', answer: 'Memnunum' },
      { questionNo: 2, questionText: 'Ürün kalitesi hakkında görüşünüz', answer: 'İyi' },
    ],
  },
  {
    id: 'resp-3',
    submittedAt: '2026-05-18T16:45:00.000Z',
    username: 'bayi02',
    fullName: 'Mehmet Kaya',
    surveyId: 'seed-2',
    surveyName: 'Müşteri Geri Bildirim',
    answers: [
      { questionNo: 1, questionText: 'Hizmet hızı nasıldı?', answer: 'Hızlı' },
      { questionNo: 2, questionText: 'Eklemek istediğiniz not', answer: 'Teslimat süreci sorunsuzdu.' },
    ],
  },
]

function read(): SurveyResponseDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      write(SEED)
      return SEED
    }
    const parsed = JSON.parse(raw) as SurveyResponseDto[]
    return parsed.length > 0 ? parsed : SEED
  } catch {
    return SEED
  }
}

function write(items: SurveyResponseDto[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function matchesSearch(row: SurveyResponseDto, search: string): boolean {
  const q = search.toLowerCase()
  if (row.username.toLowerCase().includes(q)) return true
  if (row.fullName.toLowerCase().includes(q)) return true
  if (row.surveyName.toLowerCase().includes(q)) return true
  return row.answers.some(
    (a) =>
      a.questionText.toLowerCase().includes(q) || a.answer.toLowerCase().includes(q),
  )
}

export const devResponsesStore = {
  getAll(params?: SurveyResponsesQueryParams): SurveyResponseDto[] {
    let items = read()
    if (params?.surveyId) {
      const survey = devSurveysStore.getAll().find((s) => s.id === params.surveyId)
      items = items.filter(
        (r) => r.surveyId === params.surveyId || (survey != null && r.surveyName === survey.name),
      )
    }
    if (params?.search?.trim()) {
      items = items.filter((r) => matchesSearch(r, params.search!.trim()))
    }
    return items.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )
  },
}
