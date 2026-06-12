import { Fragment, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Skeleton'
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
}

function ExpandIcon({ open }: { open: boolean }) {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center text-muted"
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
}: SurveyResponsesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-3 border-t border-border px-5 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full border-t border-border px-5 py-4">
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
    <div className="w-full border-t border-border">
      <div className="flex justify-end px-5 pt-4">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                TARİH
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                KULLANICI
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                ADI SOYADI
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                ANKET
              </th>
              <th className="w-20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                DETAY
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    compact
                    title="Henüz anket cevabı yok"
                    description="Filtreleri değiştirin veya API bağlantısını kontrol edin."
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isOpen = expandedId === row.id
                const kategoriAdi = row.baslikAdi?.trim() || 'Genel'

                return (
                  <Fragment key={row.id}>
                    <tr
                      className={cn(
                        'cursor-pointer border-b border-border/60 transition-colors hover:bg-primary-500/5',
                        isOpen && 'bg-primary-500/[0.03]',
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
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        {formatSonIslemTarihi(row.sonIslemTarihi)}
                      </td>
                      <td className="px-4 py-3 text-foreground">{getOzetKullaniciAdi(row)}</td>
                      <td className="px-4 py-3 text-foreground">{getOzetFullName(row)}</td>
                      <td className="px-4 py-3 text-foreground">{getOzetSurveyName(row)}</td>
                      <td className="px-4 py-3 text-center">
                        <ExpandIcon open={isOpen} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-border bg-surface/50">
                        <td colSpan={5} className="p-0">
                          <SurveyResponseAnswersPanel
                            ekiciId={row.ekiciId}
                            sablonId={row.sablonId}
                            baslikId={row.baslikId}
                            kategoriAdi={kategoriAdi}
                            enabled={isOpen}
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
    </div>
  )
}
