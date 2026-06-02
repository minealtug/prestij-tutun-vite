import type { CreateSurveyRequest, SurveyDto } from '../types/survey.types'

const STORAGE_KEY = 'prestij-dev-surveys'

function read(): SurveyDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SurveyDto[]
  } catch {
    return []
  }
}

function write(surveys: SurveyDto[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys))
}

/** Yalnızca geliştirme — API yokken UI testi için (production'da kullanılmaz) */
export const devSurveysStore = {
  getAll(): SurveyDto[] {
    return read()
  },

  create(payload: CreateSurveyRequest): SurveyDto {
    const survey: SurveyDto = {
      id: crypto.randomUUID(),
      name: payload.name.trim(),
      category: payload.category,
      createdAt: new Date().toISOString(),
    }
    write([...read(), survey])
    return survey
  },

  delete(id: string): void {
    write(read().filter((s) => s.id !== id))
  },
}
