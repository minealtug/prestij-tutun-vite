export type AnswerType =
  | 'long_text'
  | 'short_text'
  | 'single_choice'
  | 'multiple_choice'
  | 'number'
  | 'date'

export interface VisibilityRule {
  id: string
  linkedQuestionId?: string
  condition?: string
  value?: string
}

export interface QuestionDto {
  id: string
  isActive: boolean
  surveyName: string
  questionNo: number
  category: string
  questionText: string
  answerType: AnswerType
  linkedCondition?: string | null
}

export interface CreateQuestionRequest {
  surveyName: string
  category: string
  order: number
  answerType: AnswerType
  options?: string
  questionText: string
  visibilityRules?: VisibilityRule[]
  isActive: boolean
  saveAsDraft: boolean
}
