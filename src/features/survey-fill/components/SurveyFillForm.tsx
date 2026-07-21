import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Save, FilePen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useMintikaCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { useAnswerInputTypes, useQuestions } from '@/features/questions/hooks/use-questions'
import { useAnswerUnits } from '@/features/answer-units/hooks/use-answer-units'
import { useAuthStore } from '@/stores/auth-store'
import { useUser } from '@/features/users/hooks/use-users'
import { getErrorMessage } from '@/lib/api/api-error'
import { SurveyFillQuestionField } from './SurveyFillQuestionField'
import {
  useAnketYanitOturum,
  useSubmitAnketYanitCevapBatch,
} from '../hooks/use-anket-yanit'
import { isAnketCevapNotFoundError } from '../api/anket-yanit-api'
import { useAltSeceneklerByGrupIds } from '../hooks/use-alt-secenekler'
import { useEkiciler } from '../hooks/use-ekiciler'
import {
  enrichOturumQuestionsWithDefinitions,
  mergeAltSeceneklerIntoQuestions,
} from '../utils/enrich-oturum-questions'
import { isEkiciProducerQuestion } from '../utils/is-ekici-producer-question'
import { isAnketTamamlandiForEkici } from '../utils/is-anket-tamamlandi'
import { getEkiciFullName, isEkiciActive } from '../utils/normalize-ekici-api'
import { buildAnswerTypeKindLookup } from '../utils/build-answer-type-kind-lookup'
import { buildAnketYanitCevapRequest } from '../utils/build-anket-yanit-cevap'
import {
  buildInitialAnswersMap,
  buildPreviewQuestionsFromDefinitions,
  getDisplayFillQuestions,
  getAllOturumQuestions,
  getDraftQuestionsToSubmit,
  getFormFillProgress,
  getQuestionDisplayNumber,
  getQuestionsToSubmit,
  sortOturumQuestionsForFill,
} from '../utils/oturum-questions'
import { sortSurveyFillQuestions } from '../utils/sort-survey-fill-questions'
import { getQuestionKey } from '../utils/question-key'
import { resolveSurveyFillMintikaId } from '../utils/resolve-survey-fill-mintika-id'
import { validateSurveyFillAnswers, buildRequiredAnswersSubmitError } from '../utils/validate-survey-fill-answers'
import {
  applyManualEntryInitialAnswers,
  detectInitialManualEntryKeys,
} from '../utils/manual-entry'
import { filterVisibleQuestionsForFill } from '../utils/resolve-linked-question-visibility'
import {
  buildKontratSahibiAutofill,
  collectKontratSahibiTargetKeys,
  isKontratSahibiSelected,
  resolveKontratSahibiFieldKind,
} from '../utils/kontrat-sahibi-autofill'
import { SurveyFillSuccessModal } from './SurveyFillSuccessModal'
import type { SurveyFillDeepLinkParams } from '../utils/survey-fill-navigation'

interface SurveyFillFormProps {
  baslikId: number
  sablonId: number
  baslikAdi?: string
  sablonAdi?: string
  initialEkiciId?: string | null
  initialGeoFilters?: Pick<
    SurveyFillDeepLinkParams,
    'menseiId' | 'bolgeId' | 'mintikaId' | 'alimNoktasiId' | 'koyId'
  > | null
  canSubmit?: boolean
  onRefreshSablonlar?: () => void
}

export function SurveyFillForm({
  baslikId,
  sablonId,
  initialEkiciId = null,
  initialGeoFilters = null,
  canSubmit = true,
  onRefreshSablonlar,
}: SurveyFillFormProps) {
  const [sessionEkiciId, setSessionEkiciId] = useState<string | null>(null)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successModalVariant, setSuccessModalVariant] = useState<'full' | 'draft'>('full')
  const [lastSavedCount, setLastSavedCount] = useState(0)

  const oturumQuery = useAnketYanitOturum(
    sessionEkiciId
      ? { baslikId, sablonId, ekiciId: sessionEkiciId }
      : null,
  )
  const effectiveBaslikId = baslikId
  const submitCevapBatch = useSubmitAnketYanitCevapBatch()
  const answerInputTypesQuery = useAnswerInputTypes()
  const questionDefinitionsQuery = useQuestions(
    effectiveBaslikId > 0 ? effectiveBaslikId : undefined,
  )
  const answerUnitsQuery = useAnswerUnits()
  const answerTypeLookup = useMemo(
    () => buildAnswerTypeKindLookup(answerInputTypesQuery.data),
    [answerInputTypesQuery.data],
  )
  const answerUnitsById = useMemo(
    () =>
      new Map(
        (answerUnitsQuery.data ?? [])
          .filter((unit) => unit.id > 0 && unit.adi.trim())
          .map((unit) => [unit.id, unit.adi.trim()] as const),
      ),
    [answerUnitsQuery.data],
  )
  const cografiFiltreQuery = useMintikaCografiFiltreOptions()
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)
  const ekicilerQuery = useEkiciler(geoCascade.queryParams)
  const authUser = useAuthStore((state) => state.user)
  const authUserId = authUser?.id ? Number(authUser.id) : null
  const currentUserQuery = useUser(
    authUserId != null && Number.isFinite(authUserId) ? authUserId : null,
  )

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({})
  const [manualEntryByKey, setManualEntryByKey] = useState<Record<string, boolean>>({})
  const [lockedAnswerKeys, setLockedAnswerKeys] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const templateQuestions = useMemo(
    () => buildPreviewQuestionsFromDefinitions(questionDefinitionsQuery.data),
    [questionDefinitionsQuery.data],
  )

  const allOturumQuestions = useMemo(
    () => sortOturumQuestionsForFill(getAllOturumQuestions(oturumQuery.data)),
    [oturumQuery.data],
  )

  const sourceQuestions = useMemo(() => {
    if (sessionEkiciId && oturumQuery.data) {
      const sessionQuestions = getDisplayFillQuestions(allOturumQuestions)
      if (sessionQuestions.length > 0) return sessionQuestions
    }
    return templateQuestions
  }, [sessionEkiciId, oturumQuery.data, allOturumQuestions, templateQuestions])

  const enrichedQuestions = useMemo(
    () =>
      enrichOturumQuestionsWithDefinitions(
        sourceQuestions,
        questionDefinitionsQuery.data,
        answerInputTypesQuery.data,
      ),
    [sourceQuestions, questionDefinitionsQuery.data, answerInputTypesQuery.data],
  )

  const secenekGrupIds = useMemo(() => {
    const ids = new Set<number>()
    for (const question of enrichedQuestions) {
      if (question.secenekGrupId != null && question.secenekGrupId > 0) {
        ids.add(question.secenekGrupId)
      }
    }
    for (const question of enrichedQuestions) {
      if (question.bagliOlduguSoruId == null) continue
      const parent = enrichedQuestions.find((item) => item.soruId === question.bagliOlduguSoruId)
      if (parent?.secenekGrupId != null && parent.secenekGrupId > 0) {
        ids.add(parent.secenekGrupId)
      }
    }
    return [...ids]
  }, [enrichedQuestions])

  const altSecenekIdsBySoruId = useMemo(() => {
    const map: Record<number, number[]> = {}
    for (const question of questionDefinitionsQuery.data ?? []) {
      const soruId = Number(question.id)
      if (!Number.isFinite(soruId) || soruId <= 0) continue
      if (!question.altSecenekIds?.length) continue
      map[soruId] = question.altSecenekIds
    }
    return map
  }, [questionDefinitionsQuery.data])

  const altSeceneklerQuery = useAltSeceneklerByGrupIds(secenekGrupIds)

  const questionsWithOptions = useMemo(
    () =>
      mergeAltSeceneklerIntoQuestions(
        enrichedQuestions,
        altSeceneklerQuery.optionsByGrupId,
        altSecenekIdsBySoruId,
      ),
    [enrichedQuestions, altSeceneklerQuery.optionsByGrupId, altSecenekIdsBySoruId],
  )

  const visibleQuestions = useMemo(
    () =>
      filterVisibleQuestionsForFill(
        questionsWithOptions,
        answers,
        answerTypeLookup,
        manualEntryByKey,
      ),
    [questionsWithOptions, answers, answerTypeLookup, manualEntryByKey],
  )

  const progress = useMemo(
    () => getFormFillProgress(visibleQuestions, answers, answerTypeLookup, manualEntryByKey),
    [visibleQuestions, answers, answerTypeLookup, manualEntryByKey],
  )

  const hiddenEkiciQuestions = useMemo(
    () => allOturumQuestions.filter(isEkiciProducerQuestion),
    [allOturumQuestions],
  )

  const draftQuestionsToSubmit = useMemo(
    () =>
      sortSurveyFillQuestions(
        getDraftQuestionsToSubmit(
          [...visibleQuestions, ...hiddenEkiciQuestions],
          answers,
          initialAnswers,
          answerTypeLookup,
          manualEntryByKey,
        ),
      ),
    [
      visibleQuestions,
      hiddenEkiciQuestions,
      answers,
      initialAnswers,
      answerTypeLookup,
      manualEntryByKey,
    ],
  )

  const ekiciOptions = useMemo(
    () =>
      (ekicilerQuery.data ?? [])
        .filter((ekici) => isEkiciActive(ekici))
        .map((ekici) => ({
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

  const isSelectedEkiciPassive = selectedEkici != null && !isEkiciActive(selectedEkici)

  const isSelectedEkiciSurveyCompleted = useMemo(
    () =>
      Boolean(sessionEkiciId && oturumQuery.data && !oturumQuery.isLoading) &&
      isAnketTamamlandiForEkici(oturumQuery.data),
    [sessionEkiciId, oturumQuery.data, oturumQuery.isLoading],
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

  const questionsReady = Boolean(sessionEkiciId && oturumQuery.data && !oturumQuery.isLoading)
  const questionsDisabled =
    !questionsReady || isSelectedEkiciPassive || isSelectedEkiciSurveyCompleted
  const showQuestionsLoading =
    questionDefinitionsQuery.isLoading ||
    Boolean(sessionEkiciId && oturumQuery.isLoading)
  const showTamamlanabilir =
    Boolean(oturumQuery.data?.tamamlanabilir) &&
    visibleQuestions.length > 0 &&
    !isSelectedEkiciSurveyCompleted

  const geoFilterKey = useMemo(
    () => JSON.stringify(geoCascade.queryParams),
    [geoCascade.queryParams],
  )
  const previousGeoFilterKeyRef = useRef(geoFilterKey)
  const skipNextGeoClearRef = useRef(false)
  const deepLinkBootstrapKeyRef = useRef('')
  const kontratSahibiAutofillSignatureRef = useRef('')

  const kontratSahibiActive = useMemo(
    () => isKontratSahibiSelected(questionsWithOptions, answers),
    [questionsWithOptions, answers],
  )

  const kontratSahibiAutofillSignature = useMemo(() => {
    if (!kontratSahibiActive) return 'inactive'
    if (!selectedEkici) return 'active:no-ekici'

    const optionsFingerprint = questionsWithOptions
      .filter((question) => resolveKontratSahibiFieldKind(question) != null)
      .map((question) => {
        const optionIds = (question.altSecenekler ?? []).map((option) => option.id).join(',')
        return `${getQuestionKey(question)}:${optionIds}`
      })
      .join(';')

    return [
      'active',
      selectedEkici.id,
      selectedEkici.cinsiyet ?? '',
      selectedEkici.dogumTarihi ?? '',
      selectedEkici.adi,
      selectedEkici.soyad,
      optionsFingerprint,
    ].join('|')
  }, [kontratSahibiActive, questionsWithOptions, selectedEkici])

  const deepLinkBootstrapKey = useMemo(
    () =>
      JSON.stringify({
        baslikId,
        sablonId,
        initialEkiciId,
        initialGeoFilters,
      }),
    [baslikId, sablonId, initialEkiciId, initialGeoFilters],
  )

  useEffect(() => {
    setSessionEkiciId(null)
    setAnswers({})
    setInitialAnswers({})
    setManualEntryByKey({})
    setLockedAnswerKeys({})
    kontratSahibiAutofillSignatureRef.current = ''
    setFieldErrors({})
    setSubmitError('')
    setSuccessModalOpen(false)
    deepLinkBootstrapKeyRef.current = ''

    if (!initialGeoFilters) {
      skipNextGeoClearRef.current = true
      geoCascade.resetToScopedDefaults()
    }
  }, [baslikId, initialGeoFilters, geoCascade.resetToScopedDefaults])

  useEffect(() => {
    if (!initialGeoFilters || !cografiFiltreQuery.data) return
    if (deepLinkBootstrapKeyRef.current === deepLinkBootstrapKey) return

    skipNextGeoClearRef.current = true
    geoCascade.applyFromQueryParams(initialGeoFilters)
    deepLinkBootstrapKeyRef.current = deepLinkBootstrapKey
  }, [
    initialGeoFilters,
    cografiFiltreQuery.data,
    deepLinkBootstrapKey,
    geoCascade.applyFromQueryParams,
  ])

  useEffect(() => {
    if (!initialEkiciId || ekicilerQuery.isLoading) return
    if (!geoCascade.queryParams.mintikaId) return

    const ekiciExists = (ekicilerQuery.data ?? []).some((ekici) => ekici.id === initialEkiciId)
    if (ekiciExists) {
      setSessionEkiciId(initialEkiciId)
    }
  }, [
    initialEkiciId,
    ekicilerQuery.isLoading,
    ekicilerQuery.data,
    geoCascade.queryParams.mintikaId,
    deepLinkBootstrapKey,
  ])

  useEffect(() => {
    if (previousGeoFilterKeyRef.current === geoFilterKey) return
    previousGeoFilterKeyRef.current = geoFilterKey

    if (skipNextGeoClearRef.current) {
      skipNextGeoClearRef.current = false
      return
    }

    setSessionEkiciId(null)
    setAnswers({})
    setInitialAnswers({})
    setManualEntryByKey({})
    setLockedAnswerKeys({})
    kontratSahibiAutofillSignatureRef.current = ''
    setFieldErrors({})
    setSubmitError('')
  }, [geoFilterKey])

  useEffect(() => {
    if (sessionEkiciId) {
      if (!oturumQuery.data) return
      const questions = sortOturumQuestionsForFill(getAllOturumQuestions(oturumQuery.data))
      if (questions.length === 0) return

      const nextAnswers = buildInitialAnswersMap(questions, sessionEkiciId, answerTypeLookup)
      const manualKeys = detectInitialManualEntryKeys(questions, nextAnswers)
      const answersWithManual = applyManualEntryInitialAnswers(questions, nextAnswers, manualKeys)
      setManualEntryByKey(manualKeys)
      setLockedAnswerKeys({})
      kontratSahibiAutofillSignatureRef.current = ''
      setAnswers(answersWithManual)
      setInitialAnswers(answersWithManual)
      setFieldErrors({})
      setSubmitError('')
      return
    }

    if (templateQuestions.length === 0) return

    const nextAnswers = buildInitialAnswersMap(templateQuestions, null, answerTypeLookup)
    const manualKeys = detectInitialManualEntryKeys(templateQuestions, nextAnswers)
    const answersWithManual = applyManualEntryInitialAnswers(templateQuestions, nextAnswers, manualKeys)
    setManualEntryByKey(manualKeys)
    setLockedAnswerKeys({})
    kontratSahibiAutofillSignatureRef.current = ''
    setAnswers(answersWithManual)
    setInitialAnswers(answersWithManual)
    setFieldErrors({})
    setSubmitError('')
  }, [
    oturumQuery.dataUpdatedAt,
    sessionEkiciId,
    oturumQuery.data,
    answerTypeLookup,
    templateQuestions,
  ])

  useEffect(() => {
    if (kontratSahibiAutofillSignatureRef.current === kontratSahibiAutofillSignature) return
    kontratSahibiAutofillSignatureRef.current = kontratSahibiAutofillSignature

    const targetKeys = collectKontratSahibiTargetKeys(questionsWithOptions)

    if (!kontratSahibiActive || !selectedEkici) {
      setLockedAnswerKeys((prev) => (Object.keys(prev).length === 0 ? prev : {}))

      if (!kontratSahibiActive && targetKeys.length > 0) {
        setAnswers((prev) => {
          let changed = false
          const next = { ...prev }
          for (const key of targetKeys) {
            if (key in next) {
              delete next[key]
              changed = true
            }
          }
          return changed ? next : prev
        })
        setManualEntryByKey((prev) => {
          let changed = false
          const next = { ...prev }
          for (const key of targetKeys) {
            if (next[key]) {
              delete next[key]
              changed = true
            }
          }
          return changed ? next : prev
        })
      }
      return
    }

    const autofill = buildKontratSahibiAutofill(questionsWithOptions, selectedEkici)

    setAnswers((prev) => {
      let changed = false
      const next = { ...prev }
      for (const [key, value] of Object.entries(autofill.answers)) {
        if (next[key] !== value) {
          next[key] = value
          changed = true
        }
      }
      return changed ? next : prev
    })

    setLockedAnswerKeys(autofill.lockedKeys)

    setManualEntryByKey((prev) => {
      let changed = false
      const next = { ...prev }
      for (const key of Object.keys(autofill.lockedKeys)) {
        if (next[key]) {
          delete next[key]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [
    kontratSahibiActive,
    kontratSahibiAutofillSignature,
    questionsWithOptions,
    selectedEkici,
  ])

  const handleRefresh = () => {
    void oturumQuery.refetch()
    onRefreshSablonlar?.()
    void cografiFiltreQuery.refetch()
    void ekicilerQuery.refetch()
    void questionDefinitionsQuery.refetch()
  }

  const handleEkiciChange = (value: string) => {
    setSessionEkiciId(value || null)
    setAnswers({})
    setInitialAnswers({})
    setManualEntryByKey({})
    setLockedAnswerKeys({})
    kontratSahibiAutofillSignatureRef.current = ''
    setFieldErrors({})
    setSubmitError('')
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

  const handleEnableManualEntry = (key: string) => {
    setManualEntryByKey((prev) => ({ ...prev, [key]: true }))
    setAnswers((prev) => ({ ...prev, [key]: '' }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleDisableManualEntry = (key: string) => {
    setManualEntryByKey((prev) => ({ ...prev, [key]: false }))
    setAnswers((prev) => ({ ...prev, [key]: '' }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSaveAnswers = (mode: 'full' | 'draft') => {
    if (!canSubmit || !sessionEkiciId) {
      setSubmitError('Cevapları kaydetmek için önce ekici seçin.')
      return
    }

    if (isSelectedEkiciPassive) {
      setSubmitError(
        'Seçtiğiniz ekici pasif durumda. Anket kaydı yapılamaz; ekiciyi aktif hale getirin veya başka bir ekici seçin.',
      )
      return
    }

    if (isSelectedEkiciSurveyCompleted) {
      setSubmitError(
        'Bu ekici için anket tamamlandı. Lütfen başka bir ekici seçin.',
      )
      return
    }

    if (sablonId <= 0) {
      setSubmitError('Bu anket için kayıt şablonu bulunamadı.')
      return
    }

    if (mode === 'full') {
      const validationErrors = validateSurveyFillAnswers(
        visibleQuestions,
        answers,
        answerTypeLookup,
        manualEntryByKey,
      )
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors)
        setSubmitError(buildRequiredAnswersSubmitError(Object.keys(validationErrors).length))

        const firstInvalidQuestion = visibleQuestions.find(
          (question) => validationErrors[getQuestionKey(question)],
        )
        if (firstInvalidQuestion) {
          const elementId = `survey-fill-question-${getQuestionKey(firstInvalidQuestion)}`
          requestAnimationFrame(() => {
            document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          })
        }
        return
      }
    }

    const questionsToSubmit =
      mode === 'draft'
        ? draftQuestionsToSubmit
        : sortSurveyFillQuestions(
            getQuestionsToSubmit(
              [...visibleQuestions, ...hiddenEkiciQuestions],
              answers,
              initialAnswers,
            ),
          )

    if (questionsToSubmit.length === 0) {
      setSubmitError(
        mode === 'draft'
          ? 'Taslak olarak kaydedilecek yeni cevap bulunmuyor.'
          : 'Kaydedilecek yeni cevap bulunmuyor.',
      )
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
        effectiveBaslikId,
        sablonId,
        sessionEkiciId,
        mintikaId,
        question,
        answers[getQuestionKey(question)] ?? '',
        answerTypeLookup,
        manualEntryByKey[getQuestionKey(question)] ?? false,
      ),
    )

    const savedCount = questionsToSubmit.length

    submitCevapBatch.mutate(payloads, {
      onSuccess: () => {
        setLastSavedCount(savedCount)
        setInitialAnswers({ ...answers })
        setSuccessModalVariant(mode)
        setSuccessModalOpen(true)
      },
      onError: (error) => setSubmitError(getErrorMessage(error)),
    })
  }

  const handleSubmitAnswers = () => handleSaveAnswers('full')

  const handleSaveDraft = () => handleSaveAnswers('draft')

  const renderQuestions = () => {
    if (showQuestionsLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )
    }

    if (questionDefinitionsQuery.isError) {
      return (
        <ErrorState
          error={questionDefinitionsQuery.error}
          title="Anket soruları yüklenemedi"
          onRetry={() => void questionDefinitionsQuery.refetch()}
          compact
        />
      )
    }

    if (sessionEkiciId && oturumQuery.isError) {
      if (isAnketCevapNotFoundError(oturumQuery.error)) {
        if (templateQuestions.length > 0) {
          return renderQuestionFields()
        }

        return (
          <EmptyState
            compact
            title="Soru yok"
            description="Bu ekici ve anket için görüntülenecek soru bulunmuyor."
          />
        )
      }

      return (
        <ErrorState
          error={oturumQuery.error}
          title="Anket oturumu yüklenemedi"
          onRetry={handleRefresh}
          compact
        />
      )
    }

    if (sessionEkiciId && isSelectedEkiciSurveyCompleted) {
      return (
        <EmptyState
          compact
          title="Anket tamamlandı"
          description="Bu ekici için anket tamamlandı. Lütfen başka bir ekici seçin."
        />
      )
    }

    if (visibleQuestions.length === 0) {
      if (sessionEkiciId && oturumQuery.data?.tamamlanabilir) {
        return (
          <EmptyState
            compact
            title="Anket tamamlandı"
            description="Bu ekici için bu anketin tüm soruları yanıtlanmış."
          />
        )
      }

      return (
        <EmptyState
          compact
          title="Soru yok"
          description={
            sessionEkiciId
              ? 'Bu ekici ve anket için görüntülenecek soru bulunmuyor.'
              : 'Bu anket için tanımlı soru bulunmuyor.'
          }
        />
      )
    }

    return renderQuestionFields()
  }

  const renderQuestionFields = () => (
    <div className="space-y-4">
      {!sessionEkiciId && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Info className="h-4 w-4 shrink-0" aria-hidden />
          <span className="underline">Soruları doldurmak için yukarıdan ekici seçin.</span>
        </p>
      )}

      {visibleQuestions.map((question) => {
        const key = getQuestionKey(question)

        return (
          <SurveyFillQuestionField
            key={key}
            question={question}
            displayNumber={getQuestionDisplayNumber(visibleQuestions, question)}
            value={answers[key] ?? ''}
            error={fieldErrors[key]}
            onChange={(value) => handleAnswerChange(key, value)}
            selectLoading={altSeceneklerQuery.isLoading}
            answerTypeLookup={answerTypeLookup}
            disabled={questionsDisabled}
            locked={lockedAnswerKeys[key] ?? false}
            useManualEntry={manualEntryByKey[key] ?? false}
            onEnableManualEntry={() => handleEnableManualEntry(key)}
            onDisableManualEntry={() => handleDisableManualEntry(key)}
            answerUnitsById={answerUnitsById}
          />
        )
      })}
    </div>
  )

  return (
    <>
      <div className="border-t border-border">
        <div className="space-y-4 px-5 py-5">
          {cografiFiltreQuery.isError && (
            <ErrorState
              error={cografiFiltreQuery.error}
              title="Coğrafi filtreler yüklenemedi"
              onRetry={() => void cografiFiltreQuery.refetch()}
              compact
            />
          )}

          {cografiFiltreQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <CografiFiltreFields
              values={geoCascade.values}
              selectOptions={geoCascade.selectOptions}
              lockedLevels={geoCascade.lockedLevels}
              onMenseiChange={geoCascade.setMenseiId}
              onBolgeChange={geoCascade.setBolgeId}
              onMintikaChange={geoCascade.setMintikaId}
              onAlimNoktasiChange={geoCascade.setAlimNoktasiId}
              onKoyChange={geoCascade.setKoyId}
            />
          )}

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
            <div className="space-y-1">
              <SearchableSelect
                label="Ekici"
                value={sessionEkiciId ?? ''}
                onChange={handleEkiciChange}
                options={ekiciOptions}
                disabled={ekicilerQuery.isLoading || !geoCascade.queryParams.mintikaId}
                placeholder="Ad veya soyad ile ekici ara..."
                emptyMessage={
                  geoCascade.queryParams.koyId
                    ? 'Seçilen köyde ekici bulunamadı'
                    : geoCascade.queryParams.alimNoktasiId
                      ? 'Seçilen alım noktasında ekici bulunamadı'
                      : 'Eşleşen ekici bulunamadı'
                }
              />
            </div>
          )}

          {isSelectedEkiciPassive && selectedEkici && (
            <div
              className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                <span className="font-medium">{getEkiciFullName(selectedEkici)}</span> pasif
                durumda. Bu ekici için anket doldurulamaz. Ekiciyi aktif hale getirin veya
                listeden başka bir ekici seçin.
              </p>
            </div>
          )}

          {isSelectedEkiciSurveyCompleted && selectedEkici && !isSelectedEkiciPassive && (
            <div
              className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
              role="alert"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                <span className="font-medium">{getEkiciFullName(selectedEkici)}</span> için bu
                anket tamamlandı. Lütfen başka bir ekici seçin.
              </p>
            </div>
          )}
        </div>

        {sessionEkiciId &&
          visibleQuestions.length > 0 &&
          !oturumQuery.isError &&
          !isSelectedEkiciSurveyCompleted && (
          <div className="border-t border-border px-5 py-4">
            <p className="text-sm text-muted">
              Doldurulan:{' '}
              <span className="font-medium text-foreground">
                {progress.answered} / {progress.total}
              </span>{' '}
              soru
            </p>
          </div>
        )}

        {showTamamlanabilir && (
          <div className="mx-5 mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Tüm zorunlu sorular yanıtlandı. Anket tamamlanabilir durumda.</p>
          </div>
        )}

        <div className="space-y-4 px-5 pb-5">{renderQuestions()}</div>

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
              variant="outline"
              onClick={handleSaveDraft}
              disabled={
                !canSubmit ||
                !sessionEkiciId ||
                isSelectedEkiciPassive ||
                isSelectedEkiciSurveyCompleted ||
                draftQuestionsToSubmit.length === 0
              }
              loading={submitCevapBatch.isPending || oturumQuery.isFetching}
            >
              <FilePen className="h-4 w-4" />
              Cevaplanan soruları taslağa kaydet
            </Button>
            <Button
              onClick={handleSubmitAnswers}
              disabled={
                !canSubmit ||
                !sessionEkiciId ||
                isSelectedEkiciPassive ||
                isSelectedEkiciSurveyCompleted
              }
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
        answeredCount={lastSavedCount}
        variant={successModalVariant}
      />
    </>
  )
}
