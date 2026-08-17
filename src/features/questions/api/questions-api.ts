import { apiClient } from '@/lib/api/api-client'
import { mapQuestionFromApi, mapQuestionsFromApi } from '../utils/normalize-question-api'
import type {
  CevapGirdiTipDto,
  CreateLinkedQuestionWithMigrateRequest,
  CreateNewLinkedQuestionRequest,
  CreateQuestionRequest,
  LinkExistingQuestionRequest,
  LinkedQuestionMigrateResultDto,
  QuestionConnectionDto,
  QuestionDto,
  UpdateAnketSoruSiraItem,
  UpdateAnketSoruSiraResult,
  UpdateBagliKosulRequest,
} from '../types/question.types'

export const questionsApi = {
  getAll: async () => mapQuestionsFromApi(await apiClient.get<unknown[]>('/api/AnketSoru')),
  getByBaslikId: async (baslikId: number) =>
    mapQuestionsFromApi(await apiClient.get<unknown[]>('/api/AnketSoru', { baslikId })),
  getAnswerInputTypes: () => apiClient.get<CevapGirdiTipDto[]>('/api/AnketCevapGirdiTip'),

  create: async (payload: CreateQuestionRequest) =>
    mapQuestionFromApi(await apiClient.post<unknown>('/api/AnketSoru', payload)),

  createNewLinked: async (parentId: string | number, payload: CreateNewLinkedQuestionRequest) =>
    mapQuestionFromApi(
      await apiClient.post<unknown>(`/api/AnketSoru/${parentId}/bagli-sorular/yeni`, payload),
    ),

  linkExisting: (parentId: string | number, payload: LinkExistingQuestionRequest) =>
    apiClient.post<QuestionConnectionDto>(
      `/api/AnketSoru/${parentId}/bagli-sorular/mevcut`,
      payload,
    ),

  migrateAndAddLinked: (payload: CreateLinkedQuestionWithMigrateRequest) =>
    apiClient.post<LinkedQuestionMigrateResultDto>('/api/AnketSoruBaglanti/migrate-and-add-linked', payload),

  update: async (id: string | number, payload: Record<string, unknown>) =>
    mapQuestionFromApi(await apiClient.put<unknown>(`/api/AnketSoru/${id}`, payload)),

  updateSira: (items: UpdateAnketSoruSiraItem[]) =>
    apiClient.put<UpdateAnketSoruSiraResult>('/api/AnketSoru/sira', items),

  setActive: (id: string | number, aktif: boolean) =>
    apiClient.patch<QuestionDto>(`/api/AnketSoru/${id}/aktif?aktif=${aktif}`),

  updateBagliKosul: (id: string | number, payload: UpdateBagliKosulRequest) =>
    apiClient.patch<{ id: number; message: string }>(`/api/AnketSoru/${id}/bagli-kosul`, payload),

  delete: (id: string | number) => apiClient.delete<void>(`/api/AnketSoru/${id}`),
}
