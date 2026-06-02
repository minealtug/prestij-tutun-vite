export interface SurveyDto {
  id: string
  name: string
  category?: string
  createdAt?: string
}

export interface CreateSurveyRequest {
  name: string
  category?: string
}
