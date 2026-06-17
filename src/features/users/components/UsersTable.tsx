import { Pencil } from 'lucide-react'
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
  onEdit?: (user: UserDto) => void
  isUpdating?: boolean
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
        'inline-flex rounded-full px-1.5 py-px text-[10px] font-medium leading-tight whitespace-nowrap',
        value
          ? (trueClassName ?? 'bg-primary-500/15 text-primary-700')
          : (falseClassName ?? 'bg-muted/20 text-muted'),
      )}
    >
      {value ? trueLabel : falseLabel}
    </span>
  )
}

function buildColumns(
  onEdit?: (user: UserDto) => void,
  isUpdating = false,
): TableColumn<UserDto>[] {
  return [
  {
    key: 'userName',
    header: 'Kullanıcı',
    className: 'hidden sm:table-cell w-[12%]',
    render: (row) => (
      <span className="break-words font-medium leading-snug">{displayValue(row.userName)}</span>
    ),
  },
  {
    key: 'fullName',
    header: 'Ad Soyad',
    className: 'w-[10%]',
    render: (row) => (
      <div className="min-w-0">
        <p className="break-words font-medium leading-snug">{displayValue(row.fullName)}</p>
        <p className="break-words text-[11px] leading-snug text-muted sm:hidden">
          {displayValue(row.userName)}
        </p>
        <p className="break-all text-[11px] leading-snug text-muted md:hidden">
          {displayValue(row.email)}
        </p>
      </div>
    ),
  },
  {
    key: 'aktif',
    header: 'Durum',
    className: 'w-[6%]',
    render: (row) => (
      <BoolBadge
        value={row.aktif}
        trueLabel="Aktif"
        falseLabel="Pasif"
        trueClassName="bg-emerald-500/15 text-emerald-700"
        falseClassName="bg-red-500/15 text-red-700"
      />
    ),
  },
  {
    key: 'admin',
    header: 'Admin',
    className: 'w-[6%]',
    render: (row) => (
      <BoolBadge
        value={row.admin}
        trueLabel="Evet"
        falseLabel="Hayır"
        trueClassName="bg-primary-500/15 text-primary-700"
        falseClassName="bg-muted/20 text-muted"
      />
    ),
  },
  {
    key: 'userTypeDescription',
    header: 'Tip',
    className: 'hidden md:table-cell w-[9%]',
    render: (row) => (
      <span className="break-words leading-snug">{displayValue(row.userTypeDescription)}</span>
    ),
  },
  {
    key: 'lokasyon',
    header: 'Lok.',
    className: 'hidden md:table-cell w-[7%]',
    render: (row) => <span className="break-words leading-snug">{displayValue(row.lokasyon)}</span>,
  },
  {
    key: 'departmanAdi',
    header: 'Dept.',
    className: 'hidden lg:table-cell w-[9%]',
    render: (row) => (
      <span className="break-words leading-snug">{displayValue(row.departmanAdi)}</span>
    ),
  },
  {
    key: 'mintikaAdi',
    header: 'Mıntıka',
    className: 'hidden xl:table-cell w-[8%]',
    render: (row) => <span className="break-words leading-snug">{displayValue(row.mintikaAdi)}</span>,
  },
  {
    key: 'uretimMerkeziYetki',
    header: 'ÜM',
    className: 'hidden xl:table-cell w-[5%]',
    render: (row) => (
      <BoolBadge value={row.uretimMerkeziYetki} trueLabel="Var" falseLabel="Yok" />
    ),
  },
  {
    key: 'email',
    header: 'E-posta',
    className: 'hidden md:table-cell w-[12%]',
    render: (row) => <span className="break-all leading-snug">{displayValue(row.email)}</span>,
  },
  {
    key: 'tel',
    header: 'Tel',
    className: 'hidden lg:table-cell w-[10%]',
    render: (row) => <span className="break-words leading-snug">{displayValue(row.tel)}</span>,
  },
  ...(onEdit
    ? [
        {
          key: 'actions',
          header: 'İşlem',
          className: 'w-[5%]',
          render: (row: UserDto) => (
            <Button
              variant="ghost"
              size="sm"
              className="!h-7 !w-7 !p-0"
              aria-label="Düzenle"
              disabled={isUpdating}
              onClick={() => onEdit(row)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ),
        } satisfies TableColumn<UserDto>,
      ]
    : []),
  ]
}

function getUserRowClassName(row: UserDto) {
  return cn(!row.aktif && 'bg-red-50 hover:bg-red-100/70')
}

export function UsersTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
  onEdit,
  isUpdating = false,
}: UsersTableProps) {
  const columns = buildColumns(onEdit, isUpdating)
  if (isError) {
    return (
      <ErrorState error={error} title="Kullanıcılar yüklenemedi" onRetry={onRefresh} compact />
    )
  }

  return (
    <div className="w-full">
      <Table
        columns={columns}
        data={data}
        keyExtractor={(row) => String(row.id)}
        getRowClassName={getUserRowClassName}
        isLoading={isLoading}
        emptyTitle="Kullanıcı bulunamadı"
        emptyMessage="Arama kriterlerinize uygun kayıt yok."
        variant="plain"
        horizontalScroll={false}
        compact
        className="!rounded-none !border-0"
        pagination={{ pageSize: 25, pageSizeOptions: [10, 25, 50, 100] }}
      />
    </div>
  )
}
