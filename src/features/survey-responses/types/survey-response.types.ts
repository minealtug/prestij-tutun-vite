export interface ResponseAnswerDetail {
  questionNo: number
  questionText: string
  answer: string
}

export interface SurveyResponseDto {
  id: string
  submittedAt: string
  username: string
  fullName: string
  surveyId: string
  surveyName: string
  answers: ResponseAnswerDetail[]
}

export interface SurveyResponsesQueryParams {
  surveyId?: string
  search?: string
}
