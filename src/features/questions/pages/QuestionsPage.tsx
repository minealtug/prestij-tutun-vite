import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { getFriendlyQuestionErrorMessage } from '../utils/question-error-message'
import { QuestionForm } from '../components/QuestionForm'
import { QuestionsTable } from '../components/QuestionsTable'
import {
  useQuestions,
  useSetQuestionActive,
  useUpdateBagliKosul,
  useUpdateQuestion,
  useDeleteQuestion,
} from '../hooks/use-questions'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { useAnswerUnits } from '@/features/answer-units/hooks/use-answer-units'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import {
  BAGLI_KOSUL_ESIT,
  BAGLI_KOSUL_TIPI_OPTIONS,
  getBagliKosulTipiLabel,
  normalizeBagliKosulTipi,
} from '../utils/bagli-kosul-tipi'
import { getFriendlyAnswerTypeLabel } from '../utils/answer-type-label'
import { GORUNME_KOSULU_LABEL } from '../utils/question-field-labels'
import { AltSecenekMultiSelect } from '../components/AltSecenekMultiSelect'
import { needsSecenekGrup } from '../utils/needs-secenek-grup'
import type { QuestionDto } from '../types/question.types'
import { resolveCevapGirdiTipId } from '../utils/resolve-question-cevap-girdi-tip'
import { resolveQuestionBirimId } from '../utils/resolve-question-birim-adi'

function buildQuestionUpdatePayload(
  question: QuestionDto,
  values: {
    soruMetni: string
    aktif: boolean
    zorunlu: boolean
    anketCevapBirimId: string
    altSecenekIds: number[]
  },
): Record<string, unknown> | null {
  const cevapGirdiTipId = resolveCevapGirdiTipId(question)
  if (cevapGirdiTipId == null) return null

  const payload: Record<string, unknown> = {
    soruMetni: values.soruMetni,
    aktif: values.aktif,
    zorunlu: values.zorunlu,
    cevapGirdiTipId,
    bagliSoru: question.bagliSoru,
  }

  if (question.kaynak === 'AppDb') {
    payload.baslikId = question.baslikId
  }

  const altSoruMetni = question.altSoruMetni?.trim()
  if (altSoruMetni) payload.altSoruMetni = altSoruMetni

  if (question.secenekGrupId != null && question.secenekGrupId > 0) {
    payload.secenekGrupId = question.secenekGrupId
    if (question.kaynak === 'AppDb') {
      payload.altSecenekIds = values.altSecenekIds
    }
  }

  const parsedAnketCevapBirimId = Number(values.anketCevapBirimId)
  if (Number.isFinite(parsedAnketCevapBirimId) && parsedAnketCevapBirimId > 0) {
    payload.anketCevapBirimId = parsedAnketCevapBirimId
  }

  return payload
}

function getParentQuestionSearchText(
  value: QuestionDto['bagliOlduguSoru'],
): string {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value === 'object') {
    const candidate = value.soruMetni
    if (typeof candidate === 'string') return candidate.trim()
  }
  return ''
}

function matchesQuestionSearch(question: QuestionDto, query: string): boolean {
  const cevapTipAdi = question.cevapGirdiTipAdi?.trim()
  const fields = [
    question.soruMetni,
    question.altSoruMetni,
    question.baslikAdi,
    cevapTipAdi,
    cevapTipAdi ? getFriendlyAnswerTypeLabel(cevapTipAdi) : '',
    question.anketCevapBirimAdi,
    question.anketCevapBirim?.adi,
    getParentQuestionSearchText(question.bagliOlduguSoru),
    question.bagliKosulTipi ? getBagliKosulTipiLabel(question.bagliKosulTipi) : '',
    question.aktif ? 'aktif' : 'pasif',
    question.zorunlu ? 'zorunlu' : '',
    question.bagliSoru ? 'bağlı' : '',
    String(question.id),
  ]

  return fields
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase('tr-TR').includes(query))
}

export function QuestionsPage() {
  const location = useLocation()
  const { canRead, canEdit, loading: permissionLoading } = useRequirePagePermission()
  const isDefinitionsPage = location.pathname.startsWith('/tanimlamalar')
  const surveysQuery = useSurveys()
  const answerUnitsQuery = useAnswerUnits()
  const updateQuestion = useUpdateQuestion()
  const updateBagliKosul = useUpdateBagliKosul()
  const setQuestionActive = useSetQuestionActive()
  const deleteQuestion = useDeleteQuestion()
  const [selectedSurveyId, setSelectedSurveyId] = useState(0)
  const [search, setSearch] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<QuestionDto | null>(null)
  const [editText, setEditText] = useState('')
  const [editAktif, setEditAktif] = useState(true)
  const [editZorunlu, setEditZorunlu] = useState(false)
  const [editAnketCevapBirimId, setEditAnketCevapBirimId] = useState('')
  const [editAltSecenekIds, setEditAltSecenekIds] = useState<number[]>([])
  const [editBagliKosulTipi, setEditBagliKosulTipi] = useState(BAGLI_KOSUL_ESIT)
  const [editSaveError, setEditSaveError] = useState('')
  const [deleteError, setDeleteError] = useState<{ message: string; questionText: string } | null>(
    null,
  )
  const questionsQuery = useQuestions(isDefinitionsPage ? selectedSurveyId : undefined)

  const birimOptions = useMemo(
    () => [
      {
        key: 'placeholder',
        value: '',
        label: answerUnitsQuery.isLoading ? 'Birimler yükleniyor...' : 'Birim seçin',
      },
      ...(answerUnitsQuery.data ?? []).map((unit) => ({
        key: String(unit.id),
        value: String(unit.id),
        label: unit.adi,
      })),
    ],
    [answerUnitsQuery.data, answerUnitsQuery.isLoading],
  )

  useEffect(() => {
    if (!isDefinitionsPage) return
    if (selectedSurveyId > 0) return
    const surveys = surveysQuery.data
    if (!surveys?.length) return

    const preferredSurvey = surveys.find(
      (survey) => survey.name.trim().toLocaleLowerCase('tr-TR') === 'test2',
    )
    const defaultSurveyId = Number(preferredSurvey?.id ?? surveys[0]?.id)
    if (defaultSurveyId > 0) setSelectedSurveyId(defaultSurveyId)
  }, [isDefinitionsPage, selectedSurveyId, surveysQuery.data])

  useEffect(() => {
    setSearch('')
  }, [selectedSurveyId])

  const openEditModal = (question: QuestionDto) => {
    if (!canEdit) return
    setEditingQuestion(question)
    setEditText(question.soruMetni)
    setEditAktif(question.aktif)
    setEditZorunlu(question.zorunlu)
    const birimId = resolveQuestionBirimId(question)
    setEditAnketCevapBirimId(birimId != null ? String(birimId) : '')
    setEditAltSecenekIds(question.altSecenekIds ?? [])
    setEditBagliKosulTipi(normalizeBagliKosulTipi(question.bagliKosulTipi))
    setEditSaveError('')
  }

  const closeEditModal = () => {
    setEditingQuestion(null)
    setEditText('')
    setEditAktif(true)
    setEditZorunlu(false)
    setEditAnketCevapBirimId('')
    setEditAltSecenekIds([])
    setEditBagliKosulTipi(BAGLI_KOSUL_ESIT)
    setEditSaveError('')
  }

  const handleEditSave = async () => {
    if (!canEdit || !editingQuestion || !editText.trim()) return

    const textChanged = editText.trim() !== editingQuestion.soruMetni
    const aktifChanged = editAktif !== editingQuestion.aktif
    const zorunluChanged = editZorunlu !== editingQuestion.zorunlu
    const originalBirimId = resolveQuestionBirimId(editingQuestion)
    const birimChanged = editAnketCevapBirimId !== (originalBirimId != null ? String(originalBirimId) : '')
    const altSecenekIdsChanged =
      editingQuestion.kaynak === 'AppDb' &&
      JSON.stringify(editAltSecenekIds) !== JSON.stringify(editingQuestion.altSecenekIds ?? [])
    const questionContentChanged =
      textChanged || zorunluChanged || birimChanged || altSecenekIdsChanged
    const kosulChanged =
      editingQuestion.bagliSoru &&
      normalizeBagliKosulTipi(editBagliKosulTipi) !==
        normalizeBagliKosulTipi(editingQuestion.bagliKosulTipi)

    if (!questionContentChanged && !aktifChanged && !kosulChanged) {
      closeEditModal()
      return
    }

    setEditSaveError('')

    try {
      if (questionContentChanged) {
        const payload = buildQuestionUpdatePayload(editingQuestion, {
          soruMetni: editText.trim(),
          aktif: editAktif,
          zorunlu: editZorunlu,
          anketCevapBirimId: editAnketCevapBirimId,
          altSecenekIds: editAltSecenekIds,
        })
        if (!payload) {
          setEditSaveError('Cevap tipi bilgisi eksik; soru güncellenemedi.')
          return
        }
        await updateQuestion.mutateAsync({
          id: editingQuestion.id,
          payload,
        })
      } else if (aktifChanged) {
        await setQuestionActive.mutateAsync({
          id: editingQuestion.id,
          aktif: editAktif,
        })
      }

      if (kosulChanged) {
        await updateBagliKosul.mutateAsync({
          id: editingQuestion.id,
          payload: { bagliKosulTipi: normalizeBagliKosulTipi(editBagliKosulTipi) },
        })
      }

      closeEditModal()
    } catch {
      // Hata mesajlari mutation state uzerinden gosterilir.
    }
  }

  const handleSetPassive = (question: QuestionDto) => {
    if (!canEdit || !question.aktif) return
    if (!window.confirm('Bu soruyu pasife almak istediğinize emin misiniz?')) return
    setQuestionActive.mutate({
      id: question.id,
      aktif: false,
    })
  }

  const handleDelete = async (question: QuestionDto) => {
    if (!canEdit || deleteQuestion.isPending) return
    const preview = question.soruMetni.trim().slice(0, 80)
    const suffix = question.soruMetni.trim().length > 80 ? '…' : ''
    if (
      !window.confirm(
        `Bu soruyu silmek istediğinize emin misiniz?\n\n"${preview}${suffix}"`,
      )
    ) {
      return
    }

    try {
      await deleteQuestion.mutateAsync(question.id)
    } catch (error) {
      setDeleteError({
        message: getFriendlyQuestionErrorMessage(error, 'delete'),
        questionText: question.soruMetni.trim(),
      })
    }
  }

  const isMutating =
    updateQuestion.isPending ||
    updateBagliKosul.isPending ||
    setQuestionActive.isPending ||
    deleteQuestion.isPending

  const surveySelectOptions = (surveysQuery.data ?? []).map((survey) => ({
    key: `${survey.kaynak ?? 'unknown'}-${survey.id}`,
    value: String(survey.id),
    label: survey.name,
  }))

  const currentQuestions =
    isDefinitionsPage && selectedSurveyId <= 0 ? [] : (questionsQuery.data ?? [])

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR')
    if (!query) return currentQuestions
    return currentQuestions.filter((question) => matchesQuestionSearch(question, query))
  }, [currentQuestions, search])

  const refreshQuestions = () => {
    void questionsQuery.refetch()
    if (isDefinitionsPage && selectedSurveyId > 0) {
      void surveysQuery.refetch()
    }
  }

  const getDefinitionsError = () => {
    if (!isDefinitionsPage) return questionsQuery.error
    if (selectedSurveyId <= 0) return null
    return questionsQuery.error
  }

  const isDefinitionsLoading = isDefinitionsPage && selectedSurveyId > 0 ? questionsQuery.isLoading : false

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yetkiler kontrol ediliyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  return (
    <PageContainer>
      {!isDefinitionsPage && <QuestionForm readOnly={!canEdit} />}

      {isDefinitionsPage && (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
          <div className="w-full md:max-w-xs md:shrink-0">
            <Select
              label="Anket"
              value={selectedSurveyId > 0 ? String(selectedSurveyId) : ''}
              onChange={(e) => setSelectedSurveyId(Number(e.target.value) || 0)}
              options={[{ key: 'placeholder', value: '', label: 'Anket seçin' }, ...surveySelectOptions]}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Soru metni, cevap tipi, birim..."
                className="h-10 w-full rounded-lg border border-border bg-surface-elevated pl-9 pr-3 text-sm placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {isDefinitionsPage && (
        <QuestionsTable
          data={filteredQuestions}
          isLoading={isDefinitionsLoading}
          isError={questionsQuery.isError && Boolean(getDefinitionsError())}
          error={getDefinitionsError()}
          onRefresh={refreshQuestions}
          onEdit={canEdit ? openEditModal : undefined}
          onSetPassive={canEdit ? handleSetPassive : undefined}
          onDelete={canEdit ? (question) => void handleDelete(question) : undefined}
          isUpdating={isMutating}
        />
      )}

      <Modal
        open={Boolean(editingQuestion)}
        onClose={closeEditModal}
        title="Soruyu Düzenle"
        description="Soru metni, birim, durum ve koşul alanlarını güncelleyin"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeEditModal}>
              İptal
            </Button>
            <Button
              onClick={() => void handleEditSave()}
              loading={
                updateQuestion.isPending || updateBagliKosul.isPending || setQuestionActive.isPending
              }
              disabled={!editText.trim()}
            >
              Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Soru"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Soru metni"
            required
          />

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={editZorunlu}
                onChange={(e) => setEditZorunlu(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-foreground">Zorunlu</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={editAktif}
                onChange={(e) => setEditAktif(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-foreground">Aktif</span>
            </label>
          </div>

          <Select
            label="Birim"
            value={editAnketCevapBirimId}
            onChange={(e) => setEditAnketCevapBirimId(e.target.value)}
            options={birimOptions}
            disabled={answerUnitsQuery.isLoading}
          />

          {editingQuestion?.kaynak === 'AppDb' &&
          editingQuestion.secenekGrupId != null &&
          editingQuestion.secenekGrupId > 0 &&
          needsSecenekGrup(editingQuestion.cevapGirdiTipAdi ?? '') ? (
            <AltSecenekMultiSelect
              secenekGrupId={editingQuestion.secenekGrupId}
              value={editAltSecenekIds}
              onChange={setEditAltSecenekIds}
            />
          ) : null}

          {editingQuestion?.bagliSoru && (
            <Select
              label={GORUNME_KOSULU_LABEL}
              value={editBagliKosulTipi}
              onChange={(e) => setEditBagliKosulTipi(normalizeBagliKosulTipi(e.target.value))}
              options={BAGLI_KOSUL_TIPI_OPTIONS.map((option) => ({
                key: option.value,
                value: option.value,
                label: option.label,
              }))}
            />
          )}
          {(editSaveError || updateQuestion.isError || updateBagliKosul.isError || setQuestionActive.isError) && (
            <p className="text-sm text-red-600" role="alert">
              {editSaveError ||
                getFriendlyQuestionErrorMessage(
                  updateQuestion.error ?? updateBagliKosul.error ?? setQuestionActive.error,
                  'update',
                )}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteError)}
        onClose={() => setDeleteError(null)}
        title="Soru silinemedi"
        description="Silme işlemi tamamlanamadı"
        size="sm"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setDeleteError(null)}>Tamam</Button>
          </div>
        }
      >
        <div className="space-y-3">
          {deleteError?.questionText ? (
            <p className="rounded-lg bg-foreground/5 px-3 py-2 text-sm text-foreground">
              {deleteError.questionText}
            </p>
          ) : null}
          <p className="text-sm text-red-600" role="alert">
            {deleteError?.message ?? 'Soru silinirken bir hata oluştu.'}
          </p>
        </div>
      </Modal>
    </PageContainer>
  )
}
