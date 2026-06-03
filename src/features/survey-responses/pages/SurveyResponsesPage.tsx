import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useAuthStore } from '@/stores/auth-store'
import { SurveyResponsesTable } from '../components/SurveyResponsesTable'
import { useEkiciler } from '../hooks/use-ekiciler'
import { useSurveyResponses } from '../hooks/use-survey-responses'
import { PageContainer } from '@/components/layout/PageContainer'
import { formatEkiciLabel } from '../types/survey-response.types'

export function SurveyResponsesPage() {
  const user = useAuthStore((s) => s.user)
  const ekicilerQuery = useEkiciler()
  const [ekiciFilter, setEkiciFilter] = useState('')

  const ekiciOptions = useMemo(() => {
    const ekiciler = ekicilerQuery.data ?? []
    return ekiciler.map((e) => ({
      key: e.id,
      value: e.id,
      label: formatEkiciLabel(e),
    }))
  }, [ekicilerQuery.data])

  const responsesQuery = useSurveyResponses({
    ekiciId: ekiciFilter || undefined,
  })

  const showSelectEkiciHint = !ekiciFilter

  return (
    <PageContainer>
      <div>
        {user?.email && (
          <p className="mt-1 text-xs text-muted">
            Oturum: <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
      </div>

      <Card>
        <div className="mb-6 w-full">
          <SearchableSelect
            label="Ekici"
            value={ekiciFilter}
            onChange={setEkiciFilter}
            options={ekiciOptions}
            disabled={ekicilerQuery.isLoading}
            placeholder="Ekici ara veya seç..."
          />
        </div>

        {showSelectEkiciHint ? (
          <p className="text-sm text-muted">Listelemek için yukarıdan bir ekici seçin.</p>
        ) : (
          <SurveyResponsesTable
            data={responsesQuery.data ?? []}
            isLoading={responsesQuery.isLoading}
            isError={responsesQuery.isError}
            error={responsesQuery.error}
            onRefresh={() => void responsesQuery.refetch()}
          />
        )}
      </Card>
    </PageContainer>
  )
}
