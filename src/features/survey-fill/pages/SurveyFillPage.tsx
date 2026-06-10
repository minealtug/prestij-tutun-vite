import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { SurveyFillForm } from '../components/SurveyFillForm'
import { useAnketSablonlar } from '../hooks/use-anket-yanit'

export function SurveyFillPage() {
  const { canRead, canEdit, loading: permissionLoading } = useRequirePagePermission()
  const [selectedBaslikId, setSelectedBaslikId] = useState(0)
  const [selectedSablonId, setSelectedSablonId] = useState(0)

  const surveysQuery = useSurveys()
  const sablonlarQuery = useAnketSablonlar(selectedBaslikId > 0 ? selectedBaslikId : null)

  const surveyOptions = useMemo(
    () => [
      { key: 'placeholder', value: '', label: 'Anket seçin' },
      ...(surveysQuery.data ?? []).map((survey) => ({
        key: `${survey.kaynak ?? 'unknown'}-${survey.id}`,
        value: String(survey.id),
        label: survey.name,
      })),
    ],
    [surveysQuery.data],
  )

  const sablonOptions = useMemo(
    () => [
      {
        key: 'placeholder',
        value: '',
        label: sablonlarQuery.isLoading ? 'Şablonlar yükleniyor...' : 'Şablon seçin',
      },
      ...(sablonlarQuery.data ?? []).map((sablon) => ({
        key: String(sablon.id),
        value: String(sablon.id),
        label: sablon.adi,
      })),
    ],
    [sablonlarQuery.data, sablonlarQuery.isLoading],
  )

  const sessionReady = selectedBaslikId > 0 && selectedSablonId > 0

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
      <div>
        <h2 className="text-xl font-bold text-foreground">Anket Doldurma Ekranı</h2>
        <p className="text-sm text-muted">
          Anket ve şablon seçin, soruları sırayla yanıtlayın
        </p>
      </div>

      <Card className="overflow-hidden !p-0" interactive={false}>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Select
            label="Anket"
            value={selectedBaslikId > 0 ? String(selectedBaslikId) : ''}
            onChange={(e) => {
              setSelectedBaslikId(Number(e.target.value) || 0)
              setSelectedSablonId(0)
            }}
            options={surveyOptions}
            disabled={surveysQuery.isLoading}
            required
          />
          <Select
            label="Şablon"
            value={selectedSablonId > 0 ? String(selectedSablonId) : ''}
            onChange={(e) => setSelectedSablonId(Number(e.target.value) || 0)}
            options={sablonOptions}
            disabled={selectedBaslikId <= 0 || sablonlarQuery.isLoading}
            required
          />
        </div>

        {sessionReady ? (
          <SurveyFillForm
            baslikId={selectedBaslikId}
            sablonId={selectedSablonId}
            canSubmit={canEdit}
            onRefreshSablonlar={() => void sablonlarQuery.refetch()}
          />
        ) : (
          <div className="border-t border-border px-5 py-8 text-sm text-muted">
            Soruları görmek için anket ve şablon seçin.
          </div>
        )}
      </Card>
    </PageContainer>
  )
}
