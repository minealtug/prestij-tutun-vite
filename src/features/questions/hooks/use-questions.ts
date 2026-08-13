import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { questionsApi } from '../api/questions-api'
import type {
  CreateLinkedQuestionWithMigrateRequest,
  CreateNewLinkedQuestionRequest,
  CreateQuestionRequest,
  LinkExistingQuestionRequest,
  QuestionDto,
  UpdateBagliKosulRequest,
} from '../types/question.types'
import { buildQuestionUpdatePayload } from '../utils/build-question-update-payload'
import { persistQuestionOrder, sortQuestionsForSurvey } from '../utils/sort-questions'

export function useQuestions(baslikId?: number) {
  return useQuery({
    queryKey: queryKeys.questions.all(baslikId),
    queryFn: async () => {
      const data = baslikId ? await questionsApi.getByBaslikId(baslikId) : await questionsApi.getAll()
      return sortQuestionsForSurvey(data)
    },
    enabled: baslikId === undefined || baslikId > 0,
  })
}

export function useAnswerInputTypes() {
  return useQuery({
    queryKey: queryKeys.questions.answerInputTypes,
    queryFn: () => questionsApi.getAnswerInputTypes(),
  })
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateQuestionRequest) => questionsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useCreateNewLinkedQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      parentId,
      payload,
    }: {
      parentId: string | number
      payload: CreateNewLinkedQuestionRequest
    }) => questionsApi.createNewLinked(parentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useLinkExistingQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      parentId,
      payload,
    }: {
      parentId: string | number
      payload: LinkExistingQuestionRequest
    }) => questionsApi.linkExisting(parentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useCreateLinkedQuestionWithMigrate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLinkedQuestionWithMigrateRequest) =>
      questionsApi.migrateAndAddLinked(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Record<string, unknown> }) =>
      questionsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useSetQuestionActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, aktif }: { id: string | number; aktif: boolean }) =>
      questionsApi.setActive(id, aktif),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useUpdateBagliKosul() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number
      payload: UpdateBagliKosulRequest
    }) => questionsApi.updateBagliKosul(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => questionsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useReorderQuestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ordered,
      previous,
    }: {
      ordered: QuestionDto[]
      previous: QuestionDto[]
    }) => {
      persistQuestionOrder(ordered)

      const previousSira = new Map(
        previous.map((question) => [String(question.id), question.sira ?? null]),
      )
      let apiAccepted = true

      for (const question of ordered) {
        if (!apiAccepted) break
        if ((previousSira.get(String(question.id)) ?? null) === (question.sira ?? null)) continue

        const payload = buildQuestionUpdatePayload(question, { sira: question.sira ?? undefined })
        if (!payload) continue
        try {
          await questionsApi.update(question.id, payload)
        } catch {
          apiAccepted = false
        }
      }

      return { ordered, apiAccepted }
    },
    onMutate: async ({ ordered }) => {
      persistQuestionOrder(ordered)
      await queryClient.cancelQueries({ queryKey: ['questions'] })
      queryClient.setQueriesData({ queryKey: ['questions'] }, (current: unknown) => {
        if (!Array.isArray(current)) return current
        const byId = new Map(ordered.map((question) => [String(question.id), question]))
        const hasOverlap = current.some(
          (item) => item && typeof item === 'object' && 'id' in item && byId.has(String(item.id)),
        )
        if (!hasOverlap) return current
        return sortQuestionsForSurvey(
          current.map((item) => {
            const question = item as QuestionDto
            return byId.get(String(question.id)) ?? question
          }),
        )
      })
    },
    onSuccess: (result) => {
      if (result.apiAccepted) {
        void queryClient.invalidateQueries({ queryKey: ['questions'] })
      }
    },
  })
}
