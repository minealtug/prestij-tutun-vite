import type { AnswerType } from '../types/question.types'
import { ANSWER_TYPE_OPTIONS } from '../constants'

export function getAnswerTypeLabel(type: AnswerType): string {
  return ANSWER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}
