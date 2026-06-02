import { apiClient } from '@/lib/api/api-client'
import type { CreateQuestionRequest, QuestionDto } from '../types/question.types'

export const questionsApi = {
  getAll: () => apiClient.get<QuestionDto[]>('/questions'),

  create: (payload: CreateQuestionRequest) =>
    apiClient.post<QuestionDto>('/questions', payload),

  update: (id: string, payload: Partial<CreateQuestionRequest>) =>
    apiClient.put<QuestionDto>(`/questions/${id}`, payload),

  delete: (id: string) => apiClient.delete<void>(`/questions/${id}`),
}
