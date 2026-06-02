import { useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/lib/api/api-error'
import { QuestionForm } from '../components/QuestionForm'
import { QuestionsTable } from '../components/QuestionsTable'
import { useQuestions } from '../hooks/use-questions'
import { useCreateSurvey } from '@/features/surveys/hooks/use-surveys'
import { CATEGORY_OPTIONS } from '../constants'
import { PageContainer } from '@/components/layout/PageContainer'

export function QuestionsPage() {
  const questionsQuery = useQuestions()
  const createSurvey = useCreateSurvey()
  const [surveyModalOpen, setSurveyModalOpen] = useState(false)
  const [surveyName, setSurveyName] = useState('')
  const [surveyCategory, setSurveyCategory] = useState('Genel')

  const handleCreateSurvey = () => {
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

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Soru Yönetimi</h2>
          <p className="text-sm text-muted">Anket sorularını oluşturun ve yönetin</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSurveyModalOpen(true)}>
            <ClipboardList className="h-4 w-4" />
            Yeni Anket Ekle
          </Button>
        </div>
      </div>

      <QuestionForm />

      <Card>
        <QuestionsTable
          data={questionsQuery.data ?? []}
          isLoading={questionsQuery.isLoading}
          isError={questionsQuery.isError}
          error={questionsQuery.error}
          onRefresh={() => void questionsQuery.refetch()}
        />
      </Card>

      <Modal
        open={surveyModalOpen}
        onClose={() => setSurveyModalOpen(false)}
        title="Yeni Anket Ekle"
        description="POST /api/surveys — .NET API ile kaydedilir"
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
          <Select
            label="Kategori"
            value={surveyCategory}
            onChange={(e) => setSurveyCategory(e.target.value)}
            options={CATEGORY_OPTIONS}
          />
          {createSurvey.isError && (
            <p className="text-sm text-red-600" role="alert">
              {getErrorMessage(createSurvey.error)}
            </p>
          )}
        </div>
      </Modal>
    </PageContainer>
  )
}
