import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, X } from 'lucide-react'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { getOzetSurveyName } from '@/features/survey-responses/types/survey-response.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import {
  filterSurveysByChartStatus,
  SURVEY_CHART_GROUP_LABELS,
  SURVEY_CHART_STATUS_LABELS,
  type SurveyChartGroupBy,
  type SurveyChartStatus,
} from '../utils/enrich-survey-location'
import {
  computeSurveyStatusBars,
  filterSurveysByBarSelection,
  type SurveyStatusBarItem,
} from '../utils/compute-incomplete-survey-bars'
import { getItemProgressPercent } from '../utils/user-dashboard-survey-groups'

const GROUP_OPTIONS: SurveyChartGroupBy[] = ['ekici', 'mintika', 'bolge', 'mensei']
const STATUS_OPTIONS: SurveyChartStatus[] = ['incomplete', 'completed']

const STATUS_THEME = {
  incomplete: {
    cardBorder: 'border-amber-200/60',
    filterBanner: 'border-amber-200 bg-amber-50 text-amber-900',
    bar: '#f59e0b',
    barSelected: '#ea580c',
    tooltipCursor: 'rgba(245,158,11,0.08)',
  },
  completed: {
    cardBorder: 'border-emerald-200/60',
    filterBanner: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    bar: '#10b981',
    barSelected: '#059669',
    tooltipCursor: 'rgba(16,185,129,0.08)',
  },
} as const

interface TooltipPayloadItem {
  payload?: SurveyStatusBarItem
}

interface UserIncompleteSurveysChartCardProps {
  surveys: AnketCevapOzetItem[]
  isLoading?: boolean
}

function ChartTooltip({
  active,
  payload,
  status,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  status: SurveyChartStatus
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  if (!item) return null

  const statusLabel = SURVEY_CHART_STATUS_LABELS[status].toLowerCase()

  return (
    <div className="rounded-lg border border-[#d4dde8] bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{item.label}</p>
      <p className="mt-0.5 text-muted">
        {item.count.toLocaleString('tr-TR')} {statusLabel} anket
      </p>
    </div>
  )
}

export function UserIncompleteSurveysChartCard({
  surveys,
  isLoading = false,
}: UserIncompleteSurveysChartCardProps) {
  const [status, setStatus] = useState<SurveyChartStatus>('incomplete')
  const [groupBy, setGroupBy] = useState<SurveyChartGroupBy>('mintika')
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const theme = STATUS_THEME[status]
  const statusSurveys = useMemo(
    () => filterSurveysByChartStatus(surveys, status),
    [surveys, status],
  )
  const chartData = useMemo(
    () => computeSurveyStatusBars(surveys, groupBy, status),
    [surveys, groupBy, status],
  )
  const filteredSurveys = useMemo(
    () => filterSurveysByBarSelection(surveys, groupBy, selectedLabel, status),
    [surveys, groupBy, selectedLabel, status],
  )

  const chartHeight = Math.max(220, chartData.length * 40 + 40)

  const handleStatusChange = (next: SurveyChartStatus) => {
    setStatus(next)
    setSelectedLabel(null)
  }

  const handleGroupChange = (next: SurveyChartGroupBy) => {
    setGroupBy(next)
    setSelectedLabel(null)
  }

  return (
    <Card
      className={theme.cardBorder}
      title="Anket Karşılaştırması"
      description="Tamamlanan veya tamamlanmayan anketleri ekici, mıntıka, bölge ve menşeiye göre karşılaştırın"
      accent
      interactive={false}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleStatusChange(option)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                status === option
                  ? option === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-amber-500 text-white shadow-sm'
                  : 'border border-border bg-surface-elevated text-foreground hover:bg-primary-50',
              )}
            >
              {SURVEY_CHART_STATUS_LABELS[option]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleGroupChange(option)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                groupBy === option
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'border border-border bg-surface-elevated text-foreground hover:bg-primary-50',
              )}
            >
              {SURVEY_CHART_GROUP_LABELS[option]}
            </button>
          ))}

          {selectedLabel ? (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted"
              onClick={() => setSelectedLabel(null)}
            >
              <X className="h-3.5 w-3.5" />
              Filtreyi temizle
            </Button>
          ) : null}
        </div>

        {selectedLabel ? (
          <p className={cn('rounded-lg border px-3 py-2 text-sm', theme.filterBanner)}>
            <span className="font-semibold">{SURVEY_CHART_GROUP_LABELS[groupBy]}:</span>{' '}
            {selectedLabel} · {filteredSurveys.length.toLocaleString('tr-TR')} anket
          </p>
        ) : (
          <p className="text-xs text-muted">
            Toplam {statusSurveys.length.toLocaleString('tr-TR')}{' '}
            {SURVEY_CHART_STATUS_LABELS[status].toLowerCase()} anket
          </p>
        )}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted">Grafik yükleniyor…</p>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="mb-2 h-8 w-8 text-muted" aria-hidden />
            <p className="text-sm text-muted">
              {SURVEY_CHART_STATUS_LABELS[status]} anket bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,40,71,0.08)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#5c6b7a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fontSize: 11, fill: '#5c6b7a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip status={status} />}
                  cursor={{ fill: theme.tooltipCursor }}
                />
                <Bar
                  dataKey="count"
                  name="Anket"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
                  cursor="pointer"
                  onClick={(barData) => {
                    const payload = (barData as { payload?: SurveyStatusBarItem }).payload
                    const label = payload?.label
                    if (label) setSelectedLabel((prev) => (prev === label ? null : label))
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={selectedLabel === entry.label ? theme.barSelected : theme.bar}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {!isLoading && filteredSurveys.length > 0 ? (
          <div className="border-t border-border/80 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {selectedLabel ? 'Seçili kayıtlar' : `${SURVEY_CHART_STATUS_LABELS[status]} anketler`}
            </p>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {filteredSurveys.slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-surface-elevated/50 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{getOzetSurveyName(item)}</p>
                    <p className="truncate text-muted">
                      {status === 'completed'
                        ? `${item.yanitlananSoruSayisi} soru tamamlandı · %100`
                        : `${item.yanitlanmayanSoruSayisi} soru kaldı · %${getItemProgressPercent(item)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {filteredSurveys.length > 8 ? (
              <p className="mt-2 text-xs text-muted">+{filteredSurveys.length - 8} kayıt daha</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
