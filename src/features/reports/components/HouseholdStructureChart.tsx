import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HouseholdSeries } from '../types/age-gender-report.types'

interface HouseholdStructureChartProps {
  series: HouseholdSeries[]
}

export function HouseholdStructureChart({ series }: HouseholdStructureChartProps) {
  const chartData = useMemo(() => {
    if (series.length === 0) return []

    const labels = series[0].buckets.map((b) => b.childCount)
    return labels.map((label, index) => {
      const row: Record<string, string | number> = { childCount: label }
      for (const s of series) {
        row[s.bolgeAdi] = s.buckets[index]?.percentage ?? 0
      }
      return row
    })
  }, [series])

  if (chartData.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted">Hane yapısı verisi bulunamadı.</p>
    )
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,40,71,0.08)" vertical={false} />
          <XAxis
            dataKey="childCount"
            tick={{ fontSize: 11, fill: '#5c6b7a' }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'Çocuk sayısı',
              position: 'insideBottom',
              offset: -2,
              style: { fontSize: 11, fill: '#5c6b7a' },
            }}
          />
          <YAxis
            tickFormatter={(v: number) => `%${v}`}
            tick={{ fontSize: 11, fill: '#5c6b7a' }}
            axisLine={false}
            tickLine={false}
            width={44}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value, name) => [`%${Number(value ?? 0)}`, String(name)]}
            labelFormatter={(label) => `Çocuk sayısı: ${label}`}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #d4dde8',
              boxShadow: '0 4px 14px rgba(15,40,71,0.1)',
              fontSize: 13,
            }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Line
              key={s.bolgeAdi}
              type="monotone"
              dataKey={s.bolgeAdi}
              name={s.bolgeAdi}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
