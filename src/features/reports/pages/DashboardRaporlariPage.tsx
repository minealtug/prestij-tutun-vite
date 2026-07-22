import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileDown } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useMintikaCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { useSurveys } from '@/features/surveys/hooks/use-surveys'
import { cn } from '@/lib/utils/cn'

import { TABS, type TabKey } from '../config/ham-veri-report'
import { useYasCinsiyetReport } from '../hooks/use-yas-cinsiyet-report'
import { exportElementsToPdf } from '../utils/export-age-gender-report-pdf'

const ERKEK_COLOR = '#2A8F9E'
const KADIN_COLOR = '#E76F9B'
const BAND_COLORS = [
  '#2A8F9E',
  '#4FB3C4',
  '#E39A3B',
  '#E76F9B',
  '#7C6FE7',
  '#5BB98C',
  '#F2C14E',
]

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #d4dde8',
  boxShadow: '0 4px 14px rgba(15,40,71,0.1)',
  fontSize: 13,
}

export function DashboardRaporlariPage() {
  const { canRead, loading: permissionLoading } = useRequirePagePermission()
  const [activeTab, setActiveTab] = useState<TabKey>('ekici')

  const cografiFiltreQuery = useMintikaCografiFiltreOptions()
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)
  const surveysQuery = useSurveys()
  const [selectedBaslikId, setSelectedBaslikId] = useState('')

  const chartsRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const anketOptions = useMemo(() => {
    const surveys = surveysQuery.data ?? []
    return [
      { value: '', label: 'Anket seçin' },
      ...surveys
        .map((survey) => ({
          value: String(survey.id),
          label: survey.name.trim() || `Anket #${survey.id}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'tr-TR')),
    ]
  }, [surveysQuery.data])

  const active = TABS.find((t) => t.key === activeTab) ?? TABS[0]
  const baslikIdNum = Number(selectedBaslikId)

  const reportQuery = useYasCinsiyetReport(active, {
    baslikId: Number.isFinite(baslikIdNum) && baslikIdNum > 0 ? baslikIdNum : undefined,
    ...geoCascade.queryParams,
  })

  const report = reportQuery.data

  const { barData, genderData, bandData, totalKisi } = useMemo(() => {
    const totals = report?.genelToplam.bands ?? {}
    const bars = active.bands.map((b) => ({
      label: b.label,
      Erkek: totals[b.key]?.erkek ?? 0,
      Kadın: totals[b.key]?.kadin ?? 0,
    }))
    const totalErkek = active.bands.reduce((s, b) => s + (totals[b.key]?.erkek ?? 0), 0)
    const totalKadin = active.bands.reduce((s, b) => s + (totals[b.key]?.kadin ?? 0), 0)
    const gender = [
      { name: 'Erkek', value: totalErkek },
      { name: 'Kadın', value: totalKadin },
    ].filter((d) => d.value > 0)
    const band = active.bands
      .map((b) => ({ name: b.label, value: totals[b.key]?.toplam ?? 0 }))
      .filter((d) => d.value > 0)
    return {
      barData: bars,
      genderData: gender,
      bandData: band,
      totalKisi: totalErkek + totalKadin,
    }
  }, [report, active.bands])

  const handleExportPdf = useCallback(async () => {
    if (!chartsRef.current) return
    setExporting(true)
    try {
      const filterParts = [`Oluşturulma: ${new Date().toLocaleString('tr-TR')}`]
      if (selectedBaslikId) {
        const anket = anketOptions.find((o) => o.value === selectedBaslikId)
        if (anket) filterParts.push(`Anket: ${anket.label}`)
      }
      const dateStamp = new Date().toISOString().slice(0, 10)
      await exportElementsToPdf([chartsRef.current], {
        title: `${active.label} — Grafik Raporu`,
        subtitle: filterParts.join('  |  '),
        fileName: `dashboard-${active.key}-${dateStamp}.pdf`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
      console.error('PDF dışa aktarma hatası:', error)
      window.alert(`PDF oluşturulurken bir hata oluştu: ${message}`)
    } finally {
      setExporting(false)
    }
  }, [active, anketOptions, selectedBaslikId])

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yükleniyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  const hasData = Boolean(report) && totalKisi > 0

  return (
    <PageContainer>
      <Link
        to="/raporlar"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tüm raporlar
      </Link>

      {/* Filtreler */}
      <div className="glass-card flex flex-col gap-3 !p-4">
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

        <div className="min-w-0 sm:max-w-xs">
          <Select
            label="Anket"
            value={selectedBaslikId}
            onChange={(e) => setSelectedBaslikId(e.target.value)}
            options={anketOptions}
            disabled={surveysQuery.isLoading}
          />
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              '-mb-px rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition-colors',
              tab.key === activeTab
                ? 'border-border bg-surface-elevated text-primary-700'
                : 'border-transparent text-muted hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {reportQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[340px] w-full rounded-xl" />
          ))}
        </div>
      ) : reportQuery.isError ? (
        <ErrorState
          error={reportQuery.error}
          title="Rapor yüklenemedi"
          onRetry={() => void reportQuery.refetch()}
        />
      ) : !hasData ? (
        <Card className="flex flex-col items-center justify-center gap-2 !py-16 text-center">
          <p className="text-sm font-medium text-foreground">Grafik için veri yok</p>
          <p className="max-w-md text-xs text-muted">
            Seçtiğiniz filtrelere uygun veri bulunmuyor.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">{active.label} grafikleri</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={exporting}
              disabled={exporting}
              onClick={() => void handleExportPdf()}
            >
              <FileDown className="h-4 w-4" aria-hidden />
              PDF'e Aktar
            </Button>
          </div>

          <div ref={chartsRef} className="grid gap-4 bg-surface lg:grid-cols-2">
          <Card
            title="Yaş bandına göre cinsiyet"
            description={`${active.sourceLabel} — bandlara göre erkek/kadın dağılımı`}
            className="lg:col-span-2"
          >
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,40,71,0.08)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#5c6b7a' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#5c6b7a' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Erkek" fill={ERKEK_COLOR} radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Kadın" fill={KADIN_COLOR} radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Cinsiyet dağılımı" description={`Toplam ${totalKisi.toLocaleString('tr-TR')} kişi`}>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    labelLine={false}
                  >
                    <Cell fill={ERKEK_COLOR} />
                    <Cell fill={KADIN_COLOR} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Yaş bandı dağılımı" description="Bandlara göre toplam kişi">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bandData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={(entry) => `${entry.value}`}
                    labelLine={false}
                  >
                    {bandData.map((entry, index) => (
                      <Cell key={entry.name} fill={BAND_COLORS[index % BAND_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          </div>
        </>
      )}
    </PageContainer>
  )
}
