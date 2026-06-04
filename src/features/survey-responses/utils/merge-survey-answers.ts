import type { QuestionDto } from '@/features/questions/types/question.types'
import {
  UNANSWERED_ANSWER_LABEL,
  type ResponseAnswerDetail,
  type YanitlanmayanSoruDto,
} from '../types/survey-response.types'

function upsertUnanswered(
  byQuestionId: Map<number, ResponseAnswerDetail>,
  questionId: number,
  questionText: string,
) {
  if (byQuestionId.has(questionId)) return
  byQuestionId.set(questionId, {
    questionNo: questionId,
    questionText: questionText.trim() || '-',
    answer: UNANSWERED_ANSWER_LABEL,
    isUnanswered: true,
  })
}

export function mergeSurveyAnswers(
  answered: ResponseAnswerDetail[],
  unanswered: YanitlanmayanSoruDto[],
): ResponseAnswerDetail[] {
  const byQuestionId = new Map<number, ResponseAnswerDetail>()

  for (const item of answered) {
    byQuestionId.set(item.questionNo, { ...item, isUnanswered: false })
  }

  for (const question of unanswered) {
    upsertUnanswered(byQuestionId, question.id, question.soruMetni)
  }

  return [...byQuestionId.values()].sort((a, b) => a.questionNo - b.questionNo)
}

export function mergeWithSurveyTemplate(
  merged: ResponseAnswerDetail[],
  templateQuestions: QuestionDto[],
): ResponseAnswerDetail[] {
  const byQuestionId = new Map<number, ResponseAnswerDetail>()
  for (const item of merged) {
    byQuestionId.set(item.questionNo, item)
  }

  for (const question of templateQuestions) {
    const questionId = Number(question.id)
    if (!Number.isFinite(questionId) || questionId <= 0) continue
    upsertUnanswered(byQuestionId, questionId, question.soruMetni)
  }

  return [...byQuestionId.values()].sort((a, b) => a.questionNo - b.questionNo)
}
