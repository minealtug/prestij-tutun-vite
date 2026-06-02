import { useState, type FormEvent } from 'react'
import { Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getErrorMessage } from '@/lib/api/api-error'
import { isDevAuthEnabled } from '@/features/auth/dev/dev-auth'
import { SurveysTable } from '../components/SurveysTable'
import { useCreateSurvey, useDeleteSurvey, useSurveys } from '../hooks/use-surveys'
import { PageContainer } from '@/components/layout/PageContainer'

export function SurveysPage() {
  const surveysQuery = useSurveys()
  const createSurvey = useCreateSurvey()
  const deleteSurvey = useDeleteSurvey()
  const [surveyName, setSurveyName] = useState('')

  const surveyCount = surveysQuery.data?.length ?? 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const name = surveyName.trim()
    if (!name) return

    createSurvey.mutate(
      { name },
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card className="h-full border-primary-500/15">
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

                <Button type="submit" fullWidth loading={createSurvey.isPending}>
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

                {isDevAuthEnabled() && (
                  <div className="flex gap-2 rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-2.5">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                    <p className="text-xs leading-relaxed text-muted">
                      Geliştirme modu: API kapalıyken anketler tarayıcıda geçici saklanır.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="xl:col-span-8">
          <Card className="h-full">
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
      </div>
    </PageContainer>
  )
}
