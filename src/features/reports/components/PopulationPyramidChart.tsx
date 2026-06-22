import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PyramidSeries } from '../types/age-gender-report.types'

interface PopulationPyramidChartProps {
  series: PyramidSeries[]
  compareMode?: boolean
}

interface PyramidRow {
  label: string
  erkek: number
  kadin: number
  erkekNeg: number
  kadinPos: number
}

function buildRows(buckets: PyramidSeries['buckets']): PyramidRow[] {
  return buckets.map((b) => ({
    label: b.label,
    erkek: b.erkek,
    kadin: b.kadin,
    erkekNeg: -b.erkek,
    kadinPos: b.kadin,
  }))
}

function PyramidPanel({ data, color, title }: { data: PyramidRow[]; color: string; title: string }) {
  const maxVal = useMemo(() => {
    let max = 0
    for (const row of data) {
      max = Math.max(max, row.erkek, row.kadin)
    }
    return Math.max(max, 1)
  }, [data])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-sm font-semibold text-foreground">{title}</p>
      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            stackOffset="sign"
            margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,40,71,0.08)" horizontal={false} />
            <XAxis
              type="number"
              domain={[-maxVal * 1.15, maxVal * 1.15]}
              tickFormatter={(v: number) => String(Math.abs(v))}
              tick={{ fontSize: 11, fill: '#5c6b7a' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={44}
              tick={{ fontSize: 11, fill: '#5c6b7a' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => [
                Math.abs(Number(value ?? 0)),
                name === 'erkekNeg' ? 'Erkek' : 'Kadın',
              ]}
              labelFormatter={(label) => `Yaş grubu: ${label}`}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #d4dde8',
                boxShadow: '0 4px 14px rgba(15,40,71,0.1)',
                fontSize: 13,
              }}
            />
            <Bar dataKey="erkekNeg" name="erkekNeg" fill="#1a3d5c" radius={[4, 0, 0, 4]} barSize={14} />
            <Bar dataKey="kadinPos" name="kadinPos" fill={color} radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1a3d5c]" />
          Erkek (sol)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
          Kadın (sağ)
        </span>
      </div>
    </div>
  )
}

export function PopulationPyramidChart({ series, compareMode }: PopulationPyramidChartProps) {
  if (series.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted">Piramit verisi bulunamadı.</p>
    )
  }

  const isCompare = compareMode && series.length >= 2

  return (
    <div className={isCompare ? 'grid gap-6 lg:grid-cols-2' : ''}>
      {series.map((s) => (
        <PyramidPanel
          key={s.label}
          title={s.label}
          color={s.color}
          data={buildRows(s.buckets)}
        />
      ))}
      {isCompare && (
        <div className="col-span-full flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
