import { useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuthStore } from '@/stores/auth-store'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { SurveyResponseStatsCards } from '../components/SurveyResponseStatsCards'
import { SurveyResponsesTable } from '../components/SurveyResponsesTable'
import { useMySurveyResponses } from '../hooks/use-survey-responses'

function toSelectOptions(values: string[], placeholder: string) {
  return [{ value: '', label: placeholder }, ...values.map((value) => ({ value, label: value }))]
}

function getEkiciFullName(ad: string, soyad: string): string {
  return [ad, soyad].filter(Boolean).join(' ').trim() || '-'
}

export function MySurveyResponsesPage() {
  const { canRead, loading: permissionLoading } = useRequirePagePermission()
  const userId = useAuthStore((state) => state.user?.id)
  const authUser = useAuthStore((state) => state.user)
  const responsesQuery = useMySurveyResponses(userId)

  const [anketAdiDraft, setAnketAdiDraft] = useState('')
  const [ekiciDraft, setEkiciDraft] = useState('')
  const [anketAdiFilter, setAnketAdiFilter] = useState('')
  const [ekiciFilter, setEkiciFilter] = useState('')

  const data = useMemo(() => {
    const items = responsesQuery.data ?? []
    const fallbackKullaniciAdi = authUser?.fullName?.trim() || authUser?.userName?.trim()
    if (!fallbackKullaniciAdi) return items

    return items.map((item) =>
      item.kullaniciAdi?.trim()
        ? item
        : { ...item, kullaniciAdi: fallbackKullaniciAdi },
    )
  }, [responsesQuery.data, authUser?.fullName, authUser?.userName])

  const anketOptions = useMemo(() => {
    const uniqueNames = [...new Set(data.map((item) => item.baslikAdi?.trim() || item.sablonAdi?.trim() || ''))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'tr-TR'))
    return toSelectOptions(uniqueNames, 'Tüm anketler')
  }, [data])

  const ekiciOptions = useMemo(() => {
    const uniqueNames = [...new Set(data.map((item) => getEkiciFullName(item.ekiciAd, item.ekiciSoyad)))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'tr-TR'))
    return toSelectOptions(uniqueNames, 'Tüm ekiciler')
  }, [data])

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const surveyName = item.baslikAdi?.trim() || item.sablonAdi?.trim() || ''
        const ekiciFullName = getEkiciFullName(item.ekiciAd, item.ekiciSoyad)

        if (anketAdiFilter && surveyName !== anketAdiFilter) return false
        if (ekiciFilter && ekiciFullName !== ekiciFilter) return false
        return true
      }),
    [data, anketAdiFilter, ekiciFilter],
  )

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yetkiler kontrol ediliyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  if (!userId) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SurveyResponseStatsCards
        data={filteredData}
        isLoading={responsesQuery.isLoading}
      />

      <Card className="overflow-hidden !rounded-md !p-0" interactive={false}>
        <div className="grid w-full grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Select
            label="Anket"
            value={anketAdiDraft}
            onChange={(e) => setAnketAdiDraft(e.target.value)}
            options={anketOptions}
            disabled={responsesQuery.isLoading}
          />
          <Select
            label="Ekici"
            value={ekiciDraft}
            onChange={(e) => setEkiciDraft(e.target.value)}
            options={ekiciOptions}
            disabled={responsesQuery.isLoading}
          />
        </div>
        <div className="flex justify-end border-t border-[#ececec] px-4 py-3">
          <Button
            onClick={() => {
              setAnketAdiFilter(anketAdiDraft)
              setEkiciFilter(ekiciDraft)
            }}
            loading={responsesQuery.isFetching}
          >
            <Filter className="h-4 w-4" />
            Filtrele
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden !rounded-md !p-0" interactive={false}>
        <SurveyResponsesTable
          data={filteredData}
          isLoading={responsesQuery.isLoading}
          isError={responsesQuery.isError}
          error={responsesQuery.error}
          onRefresh={() => void responsesQuery.refetch()}
          columnBorders
          showAnswerCounts
        />
      </Card>
    </PageContainer>
  )
}
