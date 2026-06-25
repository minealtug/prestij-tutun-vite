import { Fragment, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import type { AnketCevapOzetItem } from '../types/survey-response.types'
import {
  getOzetFullName,
  getOzetKullaniciAdi,
  getOzetSurveyName,
} from '../types/survey-response.types'
import { formatSonIslemTarihi } from '../utils/map-anket-cevap'
import { SurveyResponseAnswersPanel } from './SurveyResponseAnswersPanel'

interface SurveyResponsesTableProps {
  data: AnketCevapOzetItem[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
  columnBorders?: boolean
  showAnswerCounts?: boolean
}

function formatAnswerCount(value: number) {
  return Math.max(0, value).toLocaleString('tr-TR')
}

function ExpandIcon({ open }: { open: boolean }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center text-xs text-muted"
      aria-hidden
    >
      {open ? '▲' : '▼'}
    </span>
  )
}

export function SurveyResponsesTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
  columnBorders = false,
  showAnswerCounts = false,
}: SurveyResponsesTableProps) {
  const columnCount = showAnswerCounts ? 7 : 5
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const visibleData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [currentPage, data, pageSize])

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  useEffect(() => {
    if (!expandedId) return
    if (visibleData.some((row) => row.id === expandedId)) return
    setExpandedId(null)
  }, [expandedId, visibleData])

  if (isLoading) {
    return (
      <div className="w-full space-y-2 border-t border-[#ececec] px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full border-t border-[#ececec] px-4 py-3">
        <ErrorState
          error={error}
          title="Cevaplar yüklenemedi"
          onRetry={onRefresh}
          compact
        />
      </div>
    )
  }

  return (
    <div className="w-full border-t border-[#ececec]">
      <div className="w-full overflow-x-auto">
        <table
          className={cn(
            'app-table app-table-compact',
            showAnswerCounts ? 'min-w-[72rem]' : 'min-w-[900px]',
            columnBorders && 'app-table-cols',
          )}
        >
          <thead>
            <tr>
              <th>TARİH</th>
              <th>KULLANICI</th>
              <th>ADI SOYADI</th>
              <th>ANKET</th>
              {showAnswerCounts && (
                <>
                  <th className="w-28 text-center">YANITLANAN</th>
                  <th className="w-32 text-center">YANITLANMAYAN</th>
                </>
              )}
              <th className="w-16 text-center">DETAY</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="!p-0">
                  <EmptyState
                    compact
                    title="Henüz anket cevabı yok"
                    description="Bu kriterlere uygun kayıtlı anket cevabı bulunmuyor."
                  />
                </td>
              </tr>
            ) : (
              visibleData.map((row) => {
                const isOpen = expandedId === row.id
                const kategoriAdi = row.baslikAdi?.trim() || 'Genel'

                return (
                  <Fragment key={row.id}>
                    <tr
                      className={cn(
                        'cursor-pointer',
                        isOpen && 'bg-[#fff9f0]',
                      )}
                      onClick={() => toggle(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggle(row.id)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isOpen}
                    >
                      <td className="whitespace-nowrap">{formatSonIslemTarihi(row.sonIslemTarihi)}</td>
                      <td>{getOzetKullaniciAdi(row)}</td>
                      <td>{getOzetFullName(row)}</td>
                      <td>{getOzetSurveyName(row)}</td>
                      {showAnswerCounts && (
                        <>
                          <td className="text-center font-medium text-primary-600">
                            {formatAnswerCount(row.yanitlananSoruSayisi)}
                          </td>
                          <td className="text-center font-medium text-red-600">
                            {formatAnswerCount(row.yanitlanmayanSoruSayisi)}
                          </td>
                        </>
                      )}
                      <td className="text-center">
                        <ExpandIcon open={isOpen} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[#f5f8fb]">
                        <td colSpan={columnCount} className="!p-0">
                          <SurveyResponseAnswersPanel
                            ekiciId={row.ekiciId}
                            sablonId={row.sablonId}
                            baslikId={row.baslikId}
                            kategoriAdi={kategoriAdi}
                            ekiciAdi={getOzetFullName(row)}
                            anketAdi={getOzetSurveyName(row)}
                            enabled={isOpen}
                            columnBorders={columnBorders}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-[#ececec] bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Sayfa {currentPage} / {totalPages} — {visibleData.length} / {data.length} kayıt
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Sayfadaki kayıt sayısı"
              className="h-8 rounded-md border border-border bg-white px-2 text-xs text-foreground"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
