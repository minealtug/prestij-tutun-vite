import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MintikaEkiciFillRow } from '../utils/compute-ekici-survey-coverage'

const SERIES = [
  { key: 'totalEkici', name: 'Toplam ekici', color: '#1a3d5c' },
  { key: 'completedSurveys', name: 'Tamamlanan anket', color: '#10b981' },
  { key: 'partialSurveys', name: 'Yarım kalan', color: '#f59e0b' },
  { key: 'untouchedEkici', name: 'Hiç giriş yok', color: '#94a3b8' },
] as const

export type AdminMintikaFillFocus =
  | 'totalEkici'
  | 'completedSurveys'
  | 'partialSurveys'
  | 'untouchedEkici'

export function getVisibleMintikaFillSeries(focus: AdminMintikaFillFocus | null) {
  if (!focus) return [...SERIES]
  return SERIES.filter((series) => series.key === focus)
}

interface AdminMintikaFillBarChartProps {
  rows: MintikaEkiciFillRow[]
  isLoading?: boolean
  focus?: AdminMintikaFillFocus | null
}

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
  payload?: {
    fullName: string
  }
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  if (!active || !payload?.length) return null
  const label = payload[0]?.payload?.fullName ?? ''

  return (
    <div className="rounded-lg border border-[#d4dde8] bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              {item.name}
            </span>
            <span className="font-semibold text-foreground">
              {Number(item.value ?? 0).toLocaleString('tr-TR')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminMintikaFillBarChart({
  rows,
  isLoading = false,
  focus = null,
}: AdminMintikaFillBarChartProps) {
  const visibleSeries = useMemo(() => getVisibleMintikaFillSeries(focus), [focus])
  const chartData = useMemo(
    () =>
      rows.map((row) => ({
        name: row.label.length > 12 ? `${row.label.slice(0, 12)}…` : row.label,
        fullName: row.label,
        totalEkici: row.totalEkici,
        completedSurveys: row.completedSurveys,
        partialSurveys: row.partialSurveys,
        untouchedEkici: row.untouchedEkici,
      })),
    [rows],
  )

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-muted">Grafik yükleniyor…</p>
  }

  if (chartData.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted">
        Seçili filtre için mıntıka bazlı veri yok.
      </p>
    )
  }

  const minWidth = Math.max(chartData.length * 96, 480)

  return (
    <div className="w-full overflow-x-auto scrollbar-visible">
      <div className="h-[320px]" style={{ minWidth }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8edf2" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            />
            {visibleSeries.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={series.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
