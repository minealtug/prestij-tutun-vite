import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/lib/api/api-error'
import { QuestionForm } from '../components/QuestionForm'
import { QuestionsTable } from '../components/QuestionsTable'
import {
  useDeleteQuestion,
  useQuestions,
  useSetQuestionActive,
  useUpdateQuestion,
} from '../hooks/use-questions'
import { useCreateSurvey, useSurveys } from '@/features/surveys/hooks/use-surveys'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import type { QuestionDto } from '../types/question.types'

export function QuestionsPage() {
  const location = useLocation()
  const { canRead, canEdit, loading: permissionLoading } = useRequirePagePermission()
  const isDefinitionsPage = location.pathname.startsWith('/tanimlamalar')
  const surveysQuery = useSurveys()
  const createSurvey = useCreateSurvey()
  const updateQuestion = useUpdateQuestion()
  const setQuestionActive = useSetQuestionActive()
  const deleteQuestion = useDeleteQuestion()
  const [surveyModalOpen, setSurveyModalOpen] = useState(false)
  const [surveyName, setSurveyName] = useState('')
  const [surveyCategory, setSurveyCategory] = useState('Genel')
  const [selectedSurveyId, setSelectedSurveyId] = useState(0)
  const [editingQuestion, setEditingQuestion] = useState<QuestionDto | null>(null)
  const [editText, setEditText] = useState('')
  const questionsQuery = useQuestions(isDefinitionsPage ? selectedSurveyId : undefined)

  useEffect(() => {
    if (!isDefinitionsPage) return
    if (selectedSurveyId > 0) return
    const firstSurveyId = Number(surveysQuery.data?.[0]?.id)
    if (firstSurveyId > 0) setSelectedSurveyId(firstSurveyId)
  }, [isDefinitionsPage, selectedSurveyId, surveysQuery.data])

  const handleCreateSurvey = () => {
    if (!canEdit) return
    createSurvey.mutate(
      { name: surveyName, category: surveyCategory },
      {
        onSuccess: () => {
          setSurveyModalOpen(false)
          setSurveyName('')
          setSurveyCategory('Genel')
        },
      },
    )
  }

  const openEditModal = (question: QuestionDto) => {
    if (!canEdit) return
    setEditingQuestion(question)
    setEditText(question.soruMetni)
  }

  const closeEditModal = () => {
    setEditingQuestion(null)
    setEditText('')
  }

  const handleEditSave = () => {
    if (!canEdit || !editingQuestion || !editText.trim()) return
    updateQuestion.mutate(
      {
        id: editingQuestion.id,
        payload: {
          soruMetni: editText.trim(),
          aktif: editingQuestion.aktif,
          zorunlu: editingQuestion.zorunlu,
          ...(editingQuestion.kaynak === 'AppDb' ? { baslikId: editingQuestion.baslikId } : {}),
        },
      },
      {
        onSuccess: () => closeEditModal(),
      },
    )
  }

  const handleSetPassive = (question: QuestionDto) => {
    if (!canEdit || !question.aktif) return
    if (!window.confirm('Bu soruyu pasife almak istediğinize emin misiniz?')) return
    setQuestionActive.mutate({
      id: question.id,
      aktif: false,
    })
  }

  const handleDelete = (question: QuestionDto) => {
    if (!canEdit || question.kaynak !== 'AppDb') return
    if (!window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) return
    deleteQuestion.mutate(question.id)
  }

  const isMutating =
    updateQuestion.isPending || setQuestionActive.isPending || deleteQuestion.isPending

  const surveySelectOptions = (surveysQuery.data ?? []).map((survey) => ({
    key: `${survey.kaynak ?? 'unknown'}-${survey.id}`,
    value: String(survey.id),
    label: survey.name,
  }))

  const currentQuestions =
    isDefinitionsPage && selectedSurveyId <= 0 ? [] : (questionsQuery.data ?? [])

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
      {!isDefinitionsPage && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setSurveyModalOpen(true)}
              disabled={!canEdit}
              className="border-[var(--brand-teal)] bg-[var(--brand-teal)] text-white hover:border-[var(--brand-teal-dark)] hover:bg-[var(--brand-teal-dark)] focus-visible:ring-[var(--brand-teal)]"
            >
              <ClipboardList className="h-4 w-4" />
              Yeni Anket Ekle
            </Button>
          </div>
        </div>
      )}

      {!isDefinitionsPage && <QuestionForm readOnly={!canEdit} />}

      {isDefinitionsPage && (
        <div className="w-full">
          <Select
            label="Anket"
            value={selectedSurveyId > 0 ? String(selectedSurveyId) : ''}
            onChange={(e) => setSelectedSurveyId(Number(e.target.value) || 0)}
            options={[{ key: 'placeholder', value: '', label: 'Anket seçin' }, ...surveySelectOptions]}
          />
        </div>
      )}

      {isDefinitionsPage && (
        <QuestionsTable
          data={currentQuestions}
          isLoading={isDefinitionsLoading}
          isError={questionsQuery.isError && Boolean(getDefinitionsError())}
          error={getDefinitionsError()}
          onRefresh={refreshQuestions}
          onEdit={canEdit ? openEditModal : undefined}
          onSetPassive={canEdit ? handleSetPassive : undefined}
          onDelete={canEdit ? handleDelete : undefined}
          isUpdating={isMutating}
          isDeleting={deleteQuestion.isPending}
        />
      )}

      {!isDefinitionsPage && (
        <Modal
          open={surveyModalOpen}
          onClose={() => setSurveyModalOpen(false)}
          title="Yeni Anket Ekle"
         
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSurveyModalOpen(false)}>
                İptal
              </Button>
              <Button
                onClick={handleCreateSurvey}
                loading={createSurvey.isPending}
                disabled={!surveyName.trim()}
              >
                <Plus className="h-4 w-4" />
                Kaydet
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Anket İsmi"
              value={surveyName}
              onChange={(e) => setSurveyName(e.target.value)}
              placeholder="Anket adı"
              required
            />
          
            {createSurvey.isError && (
              <p className="text-sm text-red-600" role="alert">
                {getErrorMessage(createSurvey.error)}
              </p>
            )}
          </div>
        </Modal>
      )}

      <Modal
        open={Boolean(editingQuestion)}
        onClose={closeEditModal}
        title="Soruyu Düzenle"
        description="Soru metni ve temel alanları güncelleyin"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeEditModal}>
              İptal
            </Button>
            <Button
              onClick={handleEditSave}
              loading={updateQuestion.isPending}
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
          {updateQuestion.isError && (
            <p className="text-sm text-red-600" role="alert">
              {getErrorMessage(updateQuestion.error)}
            </p>
          )}
        </div>
      </Modal>
    </PageContainer>
  )
}
