import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useAuthStore } from '@/stores/auth-store'
import { getErrorMessage } from '@/lib/api/api-error'
import { SurveyFillQuestionField } from './SurveyFillQuestionField'
import {
  useAnketYanitOturum,
  useSubmitAnketYanitCevapBatch,
} from '../hooks/use-anket-yanit'
import { useEkiciler } from '../hooks/use-ekiciler'
import {
  hasEkiciProducerQuestion,
  isEkiciProducerQuestion,
} from '../utils/is-ekici-producer-question'
import { getEkiciFullName } from '../utils/normalize-ekici-api'
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

interface SurveyFillFormProps {
  baslikId: number
  sablonId: number
  canSubmit?: boolean
  onRefreshSablonlar?: () => void
}

export function SurveyFillForm({
  baslikId,
  sablonId,
  canSubmit = true,
  onRefreshSablonlar,
}: SurveyFillFormProps) {
  const [sessionEkiciId, setSessionEkiciId] = useState<string | null>(null)
  const [ekiciDraft, setEkiciDraft] = useState('')
  const [ekiciStepError, setEkiciStepError] = useState('')

  const oturumQuery = useAnketYanitOturum(
    sessionEkiciId
      ? { baslikId, sablonId, ekiciId: sessionEkiciId }
      : null,
  )
  const submitCevapBatch = useSubmitAnketYanitCevapBatch()
  const ekicilerQuery = useEkiciler(true)
  const authUser = useAuthStore((state) => state.user)

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const visibleQuestions = useMemo(
    () => sortOturumQuestionsForFill(getVisibleOturumQuestions(oturumQuery.data)),
    [oturumQuery.data],
  )

  const progress = useMemo(
    () => getFormFillProgress(visibleQuestions, answers),
    [visibleQuestions, answers],
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
        userMintikaId: authUser?.mintikaId,
      }),
    [oturumQuery.data?.mintikaId, selectedEkici?.mintikaId, authUser?.mintikaId],
  )

  useEffect(() => {
    setSessionEkiciId(null)
    setEkiciDraft('')
    setEkiciStepError('')
    setAnswers({})
    setInitialAnswers({})
    setFieldErrors({})
  }, [baslikId, sablonId])

  useEffect(() => {
    if (!oturumQuery.data) return

    const questions = sortOturumQuestionsForFill(getVisibleOturumQuestions(oturumQuery.data))
    if (questions.length === 0) return

    const nextAnswers = buildInitialAnswersMap(questions, sessionEkiciId)
    setAnswers(nextAnswers)
    setInitialAnswers(nextAnswers)
    setFieldErrors({})
    setSubmitError('')
  }, [oturumQuery.dataUpdatedAt, sessionEkiciId, oturumQuery.data])

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

    const validationErrors = validateSurveyFillAnswers(visibleQuestions, answers)
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
      ),
    )

    submitCevapBatch.mutate(payloads, {
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
  )
}
