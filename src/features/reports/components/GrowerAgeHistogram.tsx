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
import type { GrowerAgeSeries } from '../types/age-gender-report.types'

interface GrowerAgeHistogramProps {
  series: GrowerAgeSeries[]
}

export function GrowerAgeHistogram({ series }: GrowerAgeHistogramProps) {
  const chartData = useMemo(() => {
    if (series.length === 0) return []

    const labels = series[0].buckets.map((b) => b.label)
    return labels.map((label, index) => {
      const row: Record<string, string | number> = { label }
      for (const s of series) {
        row[s.bolgeAdi] = s.buckets[index]?.count ?? 0
      }
      return row
    })
  }, [series])

  if (chartData.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted">Yaş dağılımı verisi bulunamadı.</p>
    )
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
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
            width={36}
          />
          <Tooltip
            formatter={(value, name) => [Number(value ?? 0), String(name)]}
            labelFormatter={(label) => `Yaş aralığı: ${label}`}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #d4dde8',
              boxShadow: '0 4px 14px rgba(15,40,71,0.1)',
              fontSize: 13,
            }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Bar
              key={s.bolgeAdi}
              dataKey={s.bolgeAdi}
              name={s.bolgeAdi}
              fill={s.color}
              radius={[6, 6, 0, 0]}
              maxBarSize={series.length > 1 ? 28 : 48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
