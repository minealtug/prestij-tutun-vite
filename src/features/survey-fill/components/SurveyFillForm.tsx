import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useAnswerInputTypes, useQuestions } from '@/features/questions/hooks/use-questions'
import { useAuthStore } from '@/stores/auth-store'
import { useUser } from '@/features/users/hooks/use-users'
import { getErrorMessage } from '@/lib/api/api-error'
import { SurveyFillQuestionField } from './SurveyFillQuestionField'
import {
  useAnketYanitOturum,
  useSubmitAnketYanitCevapBatch,
} from '../hooks/use-anket-yanit'
import { useAltSeceneklerByGrupIds } from '../hooks/use-alt-secenekler'
import { useEkiciler } from '../hooks/use-ekiciler'
import {
  enrichOturumQuestionsWithDefinitions,
  mergeAltSeceneklerIntoQuestions,
} from '../utils/enrich-oturum-questions'
import {
  hasEkiciProducerQuestion,
  isEkiciProducerQuestion,
} from '../utils/is-ekici-producer-question'
import { getEkiciFullName } from '../utils/normalize-ekici-api'
import { buildAnswerTypeKindLookup } from '../utils/build-answer-type-kind-lookup'
import { buildAnketYanitCevapRequest } from '../utils/build-anket-yanit-cevap'
import {
  buildInitialAnswersMap,
  getFormFillProgress,
  getQuestionDisplayNumber,
  getQuestionsToSubmit,
  getVisibleOturumQuestions,
  sortOturumQuestionsForFill,
} from '../utils/oturum-questions'
import { getQuestionKey } from '../utils/question-key'
import { resolveSurveyFillMintikaId } from '../utils/resolve-survey-fill-mintika-id'
import { validateSurveyFillAnswers } from '../utils/validate-survey-fill-answers'
import { useSurveyFillRecentStore } from '../stores/survey-fill-recent-store'
import { SurveyFillSuccessModal } from './SurveyFillSuccessModal'

interface SurveyFillFormProps {
  baslikId: number
  sablonId: number
  baslikAdi?: string
  sablonAdi?: string
  initialEkiciId?: string | null
  canSubmit?: boolean
  onRefreshSablonlar?: () => void
}

export function SurveyFillForm({
  baslikId,
  sablonId,
  baslikAdi = '',
  sablonAdi = '',
  initialEkiciId = null,
  canSubmit = true,
  onRefreshSablonlar,
}: SurveyFillFormProps) {
  const addRecentSave = useSurveyFillRecentStore((state) => state.addRecentSave)
  const [sessionEkiciId, setSessionEkiciId] = useState<string | null>(null)
  const [ekiciDraft, setEkiciDraft] = useState('')
  const [ekiciStepError, setEkiciStepError] = useState('')
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [lastSavedCount, setLastSavedCount] = useState(0)

  const oturumQuery = useAnketYanitOturum(
    sessionEkiciId
      ? { baslikId, sablonId, ekiciId: sessionEkiciId }
      : null,
  )
  const submitCevapBatch = useSubmitAnketYanitCevapBatch()
  const answerInputTypesQuery = useAnswerInputTypes()
  const questionDefinitionsQuery = useQuestions(baslikId)
  const answerTypeLookup = useMemo(
    () => buildAnswerTypeKindLookup(answerInputTypesQuery.data),
    [answerInputTypesQuery.data],
  )
  const ekicilerQuery = useEkiciler(true)
  const authUser = useAuthStore((state) => state.user)
  const authUserId = authUser?.id ? Number(authUser.id) : null
  const currentUserQuery = useUser(
    authUserId != null && Number.isFinite(authUserId) ? authUserId : null,
  )

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const baseVisibleQuestions = useMemo(
    () => sortOturumQuestionsForFill(getVisibleOturumQuestions(oturumQuery.data)),
    [oturumQuery.data],
  )

  const enrichedQuestions = useMemo(
    () =>
      enrichOturumQuestionsWithDefinitions(
        baseVisibleQuestions,
        questionDefinitionsQuery.data,
        answerInputTypesQuery.data,
      ),
    [baseVisibleQuestions, questionDefinitionsQuery.data, answerInputTypesQuery.data],
  )

  const secenekGrupIds = useMemo(
    () =>
      enrichedQuestions
        .map((question) => question.secenekGrupId)
        .filter((id): id is number => id != null && id > 0),
    [enrichedQuestions],
  )

  const altSeceneklerQuery = useAltSeceneklerByGrupIds(secenekGrupIds)

  const visibleQuestions = useMemo(
    () =>
      mergeAltSeceneklerIntoQuestions(
        enrichedQuestions,
        altSeceneklerQuery.optionsByGrupId,
      ),
    [enrichedQuestions, altSeceneklerQuery.optionsByGrupId],
  )

  const progress = useMemo(
    () => getFormFillProgress(visibleQuestions, answers, answerTypeLookup),
    [visibleQuestions, answers, answerTypeLookup],
  )

  const hasEkiciQuestion = useMemo(
    () => hasEkiciProducerQuestion(visibleQuestions),
    [visibleQuestions],
  )

  const ekiciOptions = useMemo(
    () =>
      (ekicilerQuery.data ?? []).map((ekici) => ({
        key: ekici.id,
        value: ekici.id,
        label: getEkiciFullName(ekici),
      })),
    [ekicilerQuery.data],
  )

  const selectedEkici = useMemo(
    () => (ekicilerQuery.data ?? []).find((ekici) => ekici.id === sessionEkiciId) ?? null,
    [ekicilerQuery.data, sessionEkiciId],
  )

  const mintikaId = useMemo(
    () =>
      resolveSurveyFillMintikaId({
        oturumMintikaId: oturumQuery.data?.mintikaId,
        ekiciMintikaId: selectedEkici?.mintikaId,
        userMintikaId: authUser?.mintikaId ?? currentUserQuery.data?.mintikaId,
      }),
    [
      oturumQuery.data?.mintikaId,
      selectedEkici?.mintikaId,
      authUser?.mintikaId,
      currentUserQuery.data?.mintikaId,
    ],
  )

  useEffect(() => {
    setSessionEkiciId(initialEkiciId)
    setEkiciDraft(initialEkiciId ?? '')
    setEkiciStepError('')
    setAnswers({})
    setInitialAnswers({})
    setFieldErrors({})
    setSubmitError('')
    setSuccessModalOpen(false)
  }, [baslikId, sablonId, initialEkiciId])

  useEffect(() => {
    if (!oturumQuery.data) return

    const questions = sortOturumQuestionsForFill(getVisibleOturumQuestions(oturumQuery.data))
    if (questions.length === 0) return

    const nextAnswers = buildInitialAnswersMap(questions, sessionEkiciId, answerTypeLookup)
    setAnswers(nextAnswers)
    setInitialAnswers(nextAnswers)
    setFieldErrors({})
    setSubmitError('')
  }, [oturumQuery.dataUpdatedAt, sessionEkiciId, oturumQuery.data, answerTypeLookup])

  const handleRefresh = () => {
    void oturumQuery.refetch()
    onRefreshSablonlar?.()
    void ekicilerQuery.refetch()
  }

  const handleStartSession = () => {
    if (!ekiciDraft) {
      setEkiciStepError('Ankete başlamak için ekici seçin.')
      return
    }
    setEkiciStepError('')
    setSessionEkiciId(ekiciDraft)
  }

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    if (submitError) setSubmitError('')
  }

  const handleSubmitAnswers = () => {
    if (!canSubmit || !sessionEkiciId) return

    const validationErrors = validateSurveyFillAnswers(
      visibleQuestions,
      answers,
      answerTypeLookup,
    )
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    const questionsToSubmit = getQuestionsToSubmit(visibleQuestions, answers, initialAnswers)
    if (questionsToSubmit.length === 0) {
      setSubmitError('Kaydedilecek yeni cevap bulunmuyor.')
      return
    }

    if (mintikaId == null) {
      setSubmitError(
        'Mıntıka bilgisi bulunamadı. Seçilen ekici veya kullanıcı hesabına mıntıka atanmış olmalıdır.',
      )
      return
    }

    setFieldErrors({})
    setSubmitError('')

    const payloads = questionsToSubmit.map((question) =>
      buildAnketYanitCevapRequest(
        baslikId,
        sablonId,
        sessionEkiciId,
        mintikaId,
        question,
        answers[getQuestionKey(question)] ?? '',
        answerTypeLookup,
      ),
    )

    const savedCount = questionsToSubmit.length

    submitCevapBatch.mutate(payloads, {
      onSuccess: () => {
        const ekiciAdi = selectedEkici ? getEkiciFullName(selectedEkici) : sessionEkiciId
        addRecentSave({
          baslikId,
          sablonId,
          ekiciId: sessionEkiciId,
          baslikAdi: baslikAdi || `Anket #${baslikId}`,
          sablonAdi: sablonAdi || `Şablon #${sablonId}`,
          ekiciAdi,
          answeredCount: savedCount,
        })
        setLastSavedCount(savedCount)
        setInitialAnswers({ ...answers })
        setSuccessModalOpen(true)
      },
      onError: (error) => setSubmitError(getErrorMessage(error)),
    })
  }

  if (!sessionEkiciId) {
    return (
      <div className="space-y-4 border-t border-border px-5 py-6">
        <p className="text-sm text-muted">
          Oturum başlatmak için önce ekici seçin. API, anket sorularını yüklerken ekici bilgisini
          gerektirir.
        </p>

        {ekicilerQuery.isError && (
          <ErrorState
            error={ekicilerQuery.error}
            title="Ekici listesi yüklenemedi"
            onRetry={() => void ekicilerQuery.refetch()}
            compact
          />
        )}

        {ekicilerQuery.isLoading ? (
          <Skeleton className="h-11 w-full rounded-lg" />
        ) : (
          <SearchableSelect
            label="Ekici"
            value={ekiciDraft}
            onChange={(value) => {
              setEkiciDraft(value)
              if (ekiciStepError) setEkiciStepError('')
            }}
            options={ekiciOptions}
            disabled={ekicilerQuery.isLoading}
            error={ekiciStepError}
            placeholder="Ad veya soyad ile ekici ara..."
            emptyMessage="Eşleşen ekici bulunamadı"
          />
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            onClick={handleStartSession}
            disabled={!canSubmit || ekicilerQuery.isLoading || !ekiciDraft}
          >
            <ChevronRight className="h-4 w-4" />
            Ankete Başla
          </Button>
        </div>
      </div>
    )
  }

  if (oturumQuery.isError) {
    return (
      <div className="border-t border-border px-5 py-6">
        <ErrorState
          error={oturumQuery.error}
          title="Anket oturumu yüklenemedi"
          onRetry={handleRefresh}
          compact
        />
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setSessionEkiciId(null)}>
            Ekici seçimine dön
          </Button>
        </div>
      </div>
    )
  }

  if (oturumQuery.isLoading) {
    return (
      <div className="space-y-4 border-t border-border px-5 py-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (visibleQuestions.length === 0) {
    return (
      <div className="border-t border-border px-5 py-8">
        <EmptyState
          compact
          title="Görüntülenecek soru yok"
          description="Bu oturumda görünür soru bulunmuyor."
        />
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setSessionEkiciId(null)}>
            Ekici seçimine dön
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-sm text-muted">
          Doldurulan:{' '}
          <span className="font-medium text-foreground">
            {progress.answered} / {progress.total}
          </span>{' '}
          soru
          <span className="mx-2 text-border">·</span>
          <span className="text-red-500">*</span> zorunlu alan
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSessionEkiciId(null)}>
            Ekici değiştir
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      {oturumQuery.data?.tamamlanabilir && (
        <div className="mx-5 mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Tüm zorunlu sorular yanıtlandı. Anket tamamlanabilir durumda.</p>
        </div>
      )}

      {hasEkiciQuestion && ekicilerQuery.isError && (
        <div className="px-5 pb-2">
          <ErrorState
            error={ekicilerQuery.error}
            title="Ekici listesi yüklenemedi"
            onRetry={() => void ekicilerQuery.refetch()}
            compact
          />
        </div>
      )}

      <div className="space-y-4 px-5 pb-5">
        {visibleQuestions.map((question) => {
          const key = getQuestionKey(question)
          const isEkiciQuestion = isEkiciProducerQuestion(question)

          return (
            <SurveyFillQuestionField
              key={key}
              question={question}
              displayNumber={getQuestionDisplayNumber(visibleQuestions, question)}
              value={answers[key] ?? ''}
              error={fieldErrors[key]}
              onChange={(value) => handleAnswerChange(key, value)}
              ekiciOptions={isEkiciQuestion ? ekiciOptions : undefined}
              ekiciLoading={isEkiciQuestion && ekicilerQuery.isLoading}
              selectLoading={altSeceneklerQuery.isLoading}
              answerTypeLookup={answerTypeLookup}
            />
          )
        })}
      </div>

      <div className="border-t border-border bg-surface/60 px-5 py-4">
        {submitError && (
          <p
            className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {submitError}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            onClick={handleSubmitAnswers}
            disabled={!canSubmit}
            loading={submitCevapBatch.isPending || oturumQuery.isFetching}
          >
            <Save className="h-4 w-4" />
            Cevapları Kaydet
          </Button>
        </div>
      </div>
    </div>
    <SurveyFillSuccessModal
      open={successModalOpen}
      onClose={() => setSuccessModalOpen(false)}
      baslikId={baslikId}
      answeredCount={lastSavedCount}
    />
    </>
  )
}
