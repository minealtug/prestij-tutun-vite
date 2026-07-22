import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/feedback/Skeleton'
import { Button } from './Button'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  isLoading?: boolean
  emptyTitle?: string
  emptyMessage?: string
  className?: string
  getRowClassName?: (row: T) => string | undefined
  /** Varsayılan: true. false iken tablo yatay kaydırma yapmaz, içerik kırpılır. */
  horizontalScroll?: boolean
  /** card: beyaz kapsayıcı + kenarlık. plain: yalnızca tablo (üst bileşen kapsar). */
  variant?: 'card' | 'plain'
  /** Daha sıkı satır yüksekliği */
  compact?: boolean
  /** Tablo öğesine ek sınıflar (ör. min genişlik) */
  tableClassName?: string
  pagination?: {
    pageSize: number
    pageSizeOptions?: number[]
  }
  onRowDoubleClick?: (row: T) => void
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'Kayıt bulunamadı',
  emptyMessage,
  className,
  getRowClassName,
  horizontalScroll = true,
  variant = 'card',
  compact = false,
  tableClassName,
  pagination,
  onRowDoubleClick,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPageSize, setSelectedPageSize] = useState<number | null>(null)

  const pageSize = Math.max(1, selectedPageSize ?? pagination?.pageSize ?? data.length)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const pageSizeOptions = pagination?.pageSizeOptions?.length
    ? pagination.pageSizeOptions
    : [10, 25, 50]

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  useEffect(() => {
    if (!pagination) return
    setSelectedPageSize(pagination.pageSize)
  }, [pagination])

  const visibleData = useMemo(() => {
    if (!pagination) return data
    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [currentPage, data, pageSize, pagination])

  const shellClassName = cn(
    'w-full overflow-hidden',
    variant === 'card' && 'app-table-shell',
    variant === 'plain' && '!p-0',
    className,
  )

  if (isLoading) {
    return (
      <div className={shellClassName}>
        <div className="divide-y divide-[#ececec]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 bg-white px-4 py-3">
              <Skeleton className="h-4 w-full max-w-xs" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={shellClassName}>
      <div
        className={cn(
          'w-full',
          horizontalScroll ? 'overflow-x-auto scrollbar-visible' : 'overflow-x-hidden',
        )}
      >
        <table
          className={cn(
            'app-table',
            compact && 'app-table-compact',
            horizontalScroll ? 'min-w-[640px]' : 'min-w-0 table-fixed',
            tableClassName,
          )}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="!p-0">
                  <div className="flex flex-col items-center justify-center bg-white px-4 py-10 text-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
                      <Inbox className="h-5 w-5" aria-hidden />
                    </div>
                    <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
                    {emptyMessage && (
                      <p className="mt-1 max-w-sm text-xs text-muted">{emptyMessage}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              visibleData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(getRowClassName?.(row), onRowDoubleClick && 'cursor-pointer')}
                  onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && data.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-[#ececec] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Sayfa {currentPage} / {totalPages} — {visibleData.length} / {data.length} kayıt
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Sayfadaki kayıt sayısı"
              className="h-8 rounded-md border border-border bg-white px-2 text-xs text-foreground"
              value={pageSize}
              onChange={(e) => {
                setSelectedPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              {pageSizeOptions.map((size) => (
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
