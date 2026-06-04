import type { SurveyDto } from '@/features/surveys/types/survey.types'
import type { SurveyResponseGroup } from '../types/survey-response.types'

export function resolveBaslikId(group: SurveyResponseGroup, surveys: SurveyDto[]): number {
  if (group.baslikId > 0) {
    const byId = surveys.find((survey) => Number(survey.id) === group.baslikId)
    if (byId) return group.baslikId
  }

  const normalizedName = group.surveyName.trim().toLocaleLowerCase('tr-TR')
  const byName = surveys.find(
    (survey) => survey.name.trim().toLocaleLowerCase('tr-TR') === normalizedName,
  )
  if (byName) {
    const id = Number(byName.id)
    if (Number.isFinite(id) && id > 0) return id
  }

  return group.baslikId
}
