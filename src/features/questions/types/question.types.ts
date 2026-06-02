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
  id: string | number
  bolumId: number
  cevapGirdiTipId: number
  soruMetni: string
  altSoruMetni: string | null
  zorunlu: boolean
  aktif: boolean
  secenekGrupId: number | null
  bagliSoru: boolean
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
