import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { UserDto } from '../types/user.types'

interface UsersTableProps {
  data: UserDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
}

function displayValue(value: string | null | undefined, fallback = '—') {
  const text = value?.trim()
  return text ? text : fallback
}

function BoolBadge({
  value,
  trueLabel,
  falseLabel,
  trueClassName,
  falseClassName,
}: {
  value: boolean
  trueLabel: string
  falseLabel: string
  trueClassName?: string
  falseClassName?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        value
          ? (trueClassName ?? 'bg-primary-500/15 text-primary-700')
          : (falseClassName ?? 'bg-muted/20 text-muted'),
      )}
    >
      {value ? trueLabel : falseLabel}
    </span>
  )
}

const columns: TableColumn<UserDto>[] = [
  {
    key: 'userName',
    header: 'Kullanıcı Adı',
    className: 'hidden sm:table-cell min-w-[120px]',
    render: (row) => <span className="font-medium">{displayValue(row.userName)}</span>,
  },
  {
    key: 'fullName',
    header: 'Ad Soyad',
    className: 'min-w-[160px]',
    render: (row) => (
      <div className="min-w-0">
        <p className="font-medium truncate">{displayValue(row.fullName)}</p>
        <p className="text-xs text-muted truncate sm:hidden">{displayValue(row.userName)}</p>
        <p className="text-xs text-muted truncate md:hidden">{displayValue(row.email)}</p>
      </div>
    ),
  },
  {
    key: 'userTypeDescription',
    header: 'Kullanıcı Tipi',
    className: 'hidden md:table-cell min-w-[130px]',
    render: (row) => displayValue(row.userTypeDescription),
  },
  {
    key: 'lokasyon',
    header: 'Lokasyon',
    className: 'hidden md:table-cell min-w-[100px]',
    render: (row) => displayValue(row.lokasyon),
  },
  {
    key: 'departmanAdi',
    header: 'Departman',
    className: 'hidden lg:table-cell min-w-[120px]',
    render: (row) => displayValue(row.departmanAdi),
  },
  {
    key: 'mintikaAdi',
    header: 'Mıntıka',
    className: 'hidden xl:table-cell min-w-[110px]',
    render: (row) => displayValue(row.mintikaAdi),
  },
  {
    key: 'uretimMerkeziYetki',
    header: 'ÜM Yetkisi',
    className: 'hidden xl:table-cell w-[100px]',
    render: (row) => (
      <BoolBadge value={row.uretimMerkeziYetki} trueLabel="Var" falseLabel="Yok" />
    ),
  },
  {
    key: 'email',
    header: 'E-posta',
    className: 'hidden md:table-cell min-w-[180px]',
    render: (row) => (
      <span className="block truncate max-w-[220px]" title={row.email ?? undefined}>
        {displayValue(row.email)}
      </span>
    ),
  },
  {
    key: 'tel',
    header: 'Telefon',
    className: 'hidden lg:table-cell min-w-[120px] whitespace-nowrap',
    render: (row) => displayValue(row.tel),
  },
]

function getUserRowClassName(row: UserDto) {
  return cn(
    !row.aktif && 'bg-red-50 hover:bg-red-100/70',
    row.admin && 'border-l-[3px] border-l-sidebar-active',
  )
}

export function UsersTable({ data, isLoading, isError, error, onRefresh }: UsersTableProps) {
  if (isError) {
    return (
      <ErrorState error={error} title="Kullanıcılar yüklenemedi" onRetry={onRefresh} compact />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      <Table
        columns={columns}
        data={data}
        keyExtractor={(row) => String(row.id)}
        getRowClassName={getUserRowClassName}
        isLoading={isLoading}
        emptyTitle="Kullanıcı bulunamadı"
        emptyMessage="Arama kriterlerinize uygun kayıt yok."
        className="[&_table]:min-w-[480px]"
        pagination={{ pageSize: 25, pageSizeOptions: [10, 25, 50, 100] }}
      />
    </div>
  )
}
