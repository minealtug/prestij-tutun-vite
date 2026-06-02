import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/feedback/Skeleton'

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
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'Kayıt bulunamadı',
  emptyMessage,
  className,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden !p-0 hover:translate-y-0">
        <div className="space-y-0 divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              <Skeleton className="h-4 w-full max-w-xs" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('glass-card overflow-hidden !p-0 hover:translate-y-0', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-primary-500/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3 font-semibold text-foreground', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
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
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-primary-500/5"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-foreground', col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
