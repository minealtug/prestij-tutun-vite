import { useMemo, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/lib/api/api-error'
import { SurveysTable } from '../components/SurveysTable'
import { useCreateSurvey, useDeleteSurvey, useSurveys } from '../hooks/use-surveys'
import { useQuestions } from '@/features/questions/hooks/use-questions'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import {
  DUPLICATE_SURVEY_NAME_MESSAGE,
  isSurveyNameTaken,
} from '../utils/survey-name'
import {
  isSurveyDeleteBlockedByQuestions,
  SURVEY_DELETE_BLOCKED_BY_QUESTIONS_MESSAGE,
  surveyHasLinkedQuestions,
} from '../utils/survey-delete'
import type { SurveyDto } from '../types/survey.types'

export function SurveysPage() {
  const { canRead, canEdit, loading: permissionLoading } = useRequirePagePermission()
  const surveysQuery = useSurveys()
  const questionsQuery = useQuestions()
  const createSurvey = useCreateSurvey()
  const deleteSurvey = useDeleteSurvey()
  const [surveyName, setSurveyName] = useState('')
  const [blockedDeleteSurvey, setBlockedDeleteSurvey] = useState<SurveyDto | null>(null)

  const allQuestions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data])

  const surveyCount = surveysQuery.data?.length ?? 0
  const trimmedName = surveyName.trim()
  const isDuplicateName = useMemo(
    () => isSurveyNameTaken(trimmedName, surveysQuery.data ?? []),
    [trimmedName, surveysQuery.data],
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canEdit || !trimmedName || isDuplicateName) return

    createSurvey.mutate(
      { name: trimmedName },
      {
        onSuccess: () => setSurveyName(''),
      },
    )
  }

  const handleDelete = async (id: string) => {
    if (!canEdit || deleteSurvey.isPending) return

    const survey = surveysQuery.data?.find((item) => item.id === id)
    if (!window.confirm('Bu anketi silmek istediğinize emin misiniz?')) return

    if (surveyHasLinkedQuestions(id, allQuestions)) {
      setBlockedDeleteSurvey(survey ?? { id, name: '-' })
      return
    }

    try {
      await deleteSurvey.mutateAsync(id)
    } catch (error) {
      if (isSurveyDeleteBlockedByQuestions(error)) {
        setBlockedDeleteSurvey(survey ?? { id, name: '-' })
        return
      }

      window.alert(getErrorMessage(error))
    }
  }

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
      <div className="space-y-6">
        <Card className="border-primary-500/15">
          <form onSubmit={handleSubmit}>
            <div className="mb-5 flex items-start gap-3 border-b border-border pb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Yeni Anket</h3>
                <p className="mt-0.5 text-xs text-muted">Listeye yeni anket ekleyin</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Anket İsmi"
                value={surveyName}
                onChange={(e) => setSurveyName(e.target.value)}
                placeholder="Örn: Sezon Sonu Anketi"
                required
              />

              {isDuplicateName && (
                <p
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  role="alert"
                >
                  {DUPLICATE_SURVEY_NAME_MESSAGE}
                </p>
              )}

              <Button
                type="submit"
                fullWidth
                loading={createSurvey.isPending}
                disabled={!canEdit || !trimmedName || isDuplicateName}
              >
                <Plus className="h-4 w-4" />
                Anket Ekle
              </Button>

              {createSurvey.isError && (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {getErrorMessage(createSurvey.error)}
                </p>
              )}

              {createSurvey.isSuccess && (
                <p className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                  Anket başarıyla eklendi.
                </p>
              )}
            </div>
          </form>
        </Card>

        <SurveysTable
          data={surveysQuery.data ?? []}
          isLoading={surveysQuery.isLoading}
          isError={surveysQuery.isError}
          error={surveysQuery.error}
          count={surveyCount}
          onRefresh={() => void surveysQuery.refetch()}
          onDelete={canEdit ? handleDelete : undefined}
          isDeleting={deleteSurvey.isPending}
        />
      </div>

      <Modal
        open={blockedDeleteSurvey != null}
        onClose={() => setBlockedDeleteSurvey(null)}
        title="Anket silinemedi"
        description="Silme işlemi tamamlanamadı"
        size="sm"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setBlockedDeleteSurvey(null)}>Tamam</Button>
          </div>
        }
      >
        <div className="space-y-3">
          {blockedDeleteSurvey?.name ? (
            <p className="rounded-lg bg-foreground/5 px-3 py-2 text-sm text-foreground">
              {blockedDeleteSurvey.name}
            </p>
          ) : null}
          <p className="text-sm text-amber-800" role="alert">
            {SURVEY_DELETE_BLOCKED_BY_QUESTIONS_MESSAGE}
          </p>
        </div>
      </Modal>
    </PageContainer>
  )
}
