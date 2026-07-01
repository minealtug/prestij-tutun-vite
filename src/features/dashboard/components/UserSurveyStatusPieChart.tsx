import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface UserSurveyStatusSlice {
  key: 'completed' | 'partial'
  name: string
  value: number
  color: string
}

interface UserSurveyStatusPieChartProps {
  completed: number
  partial: number
  isLoading?: boolean
}

const SLICE_DEFINITIONS: Omit<UserSurveyStatusSlice, 'value'>[] = [
  { key: 'completed', name: 'Tamamlanan form', color: '#10b981' },
  { key: 'partial', name: 'Yarım kalan form', color: '#f59e0b' },
]

function buildSlices(completed: number, partial: number): UserSurveyStatusSlice[] {
  return SLICE_DEFINITIONS.map((slice) => ({
    ...slice,
    value: slice.key === 'completed' ? completed : partial,
  })).filter((slice) => slice.value > 0)
}

interface TooltipPayloadItem {
  name?: string
  value?: number
  payload?: UserSurveyStatusSlice
}

function ChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  total: number
}) {
  if (!active || !payload?.length) return null

  const item = payload[0]
  const value = item.value ?? 0
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className="rounded-lg border border-[#d4dde8] bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="mt-0.5 text-muted">
        {value.toLocaleString('tr-TR')} form · %{percent}
      </p>
    </div>
  )
}

export function UserSurveyStatusPieChart({
  completed,
  partial,
  isLoading = false,
}: UserSurveyStatusPieChartProps) {
  const slices = useMemo(() => buildSlices(completed, partial), [completed, partial])
  const total = completed + partial

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-muted">Grafik yükleniyor…</p>
  }

  if (total === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted">
        Grafik için henüz form kaydı bulunmuyor.
      </p>
    )
  }

  return (
    <div className="w-full">
      <p className="mb-2 text-center text-sm text-muted">
        Toplam{' '}
        <span className="font-semibold text-foreground">{total.toLocaleString('tr-TR')}</span> form
      </p>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="#fff"
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip total={total} />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
