import { useMemo, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getErrorMessage } from '@/lib/api/api-error'
import { SurveysTable } from '../components/SurveysTable'
import { useCreateSurvey, useDeleteSurvey, useSurveys } from '../hooks/use-surveys'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  DUPLICATE_SURVEY_NAME_MESSAGE,
  isSurveyNameTaken,
} from '../utils/survey-name'

export function SurveysPage() {
  const surveysQuery = useSurveys()
  const createSurvey = useCreateSurvey()
  const deleteSurvey = useDeleteSurvey()
  const [surveyName, setSurveyName] = useState('')

  const surveyCount = surveysQuery.data?.length ?? 0
  const trimmedName = surveyName.trim()
  const isDuplicateName = useMemo(
    () => isSurveyNameTaken(trimmedName, surveysQuery.data ?? []),
    [trimmedName, surveysQuery.data],
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmedName || isDuplicateName) return

    createSurvey.mutate(
      { name: trimmedName },
      {
        onSuccess: () => setSurveyName(''),
      },
    )
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Bu anketi silmek istediğinize emin misiniz?')) return
    deleteSurvey.mutate(id)
  }

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
                disabled={!trimmedName || isDuplicateName}
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

        <Card>
          <SurveysTable
            data={surveysQuery.data ?? []}
            isLoading={surveysQuery.isLoading}
            isError={surveysQuery.isError}
            error={surveysQuery.error}
            count={surveyCount}
            onRefresh={() => void surveysQuery.refetch()}
            onDelete={handleDelete}
            isDeleting={deleteSurvey.isPending}
          />
        </Card>
      </div>
    </PageContainer>
  )
}
