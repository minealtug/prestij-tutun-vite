import { apiClient } from '@/lib/api/api-client'
import type { CreateQuestionRequest, QuestionDto } from '../types/question.types'

export const questionsApi = {
  getAll: () => apiClient.get<QuestionDto[]>('/api/AnketSoru'),

  create: (payload: CreateQuestionRequest) =>
    apiClient.post<QuestionDto>('/questions', payload),

  update: (id: string | number, payload: Record<string, unknown>) =>
    apiClient.put<QuestionDto>(`/questions/${id}`, payload),

  delete: (id: string | number) => apiClient.delete<void>(`/questions/${id}`),
}
