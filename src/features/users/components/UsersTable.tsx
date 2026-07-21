import { useEffect, useMemo, useState } from 'react'
import { Inbox, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import type { UserDto } from '../types/user.types'
import { UserAvatar } from './UserAvatar'

interface UsersTableProps {
  data: UserDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
  onEdit?: (user: UserDto) => void
  isUpdating?: boolean
}

const PAGE_SIZE = 25
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

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

function getUserRowClassName(row: UserDto) {
  return cn(
    !row.aktif && 'bg-red-50 shadow-[inset_4px_0_0_0_#ef4444] hover:bg-red-100/70',
  )
}

function UsersPagination({
  currentPage,
  totalPages,
  pageSize,
  visibleCount,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  currentPage: number
  totalPages: number
  pageSize: number
  visibleCount: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-[#ececec] bg-white px-3 py-3',
        'sm:flex-row sm:items-center sm:justify-between sm:px-4',
        className,
      )}
    >
      <p className="text-xs text-muted">
        Sayfa {currentPage} / {totalPages} — {visibleCount} / {totalCount} kayıt
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Sayfadaki kayıt sayısı"
          className="h-8 rounded-md border border-border bg-white px-2 text-xs text-foreground"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          Önceki
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Sonraki
        </Button>
      </div>
    </div>
  )
}

function UsersMobileCard({
  user,
  onEdit,
  isUpdating,
}: {
  user: UserDto
  onEdit?: (user: UserDto) => void
  isUpdating?: boolean
}) {
  const meta = [user.departmanAdi, user.mintikaAdi, user.lokasyon].filter(Boolean)

  return (
    <article
      className={cn(
        'flex gap-3 px-3 py-3 sm:px-4',
        getUserRowClassName(user),
      )}
    >
      <UserAvatar
        fullName={user.fullName}
        fotografUrl={user.fotografUrl}
        cacheKey={user.id}
        className="h-11 w-11"
        imageClassName="h-11 w-11"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="break-words font-medium leading-snug text-foreground">
              {displayValue(user.fullName)}
            </p>
            <p className="break-all text-xs leading-snug text-muted">
              {displayValue(user.userName)}
            </p>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="!h-8 !w-8 shrink-0 !p-0"
              aria-label="Düzenle"
              disabled={isUpdating}
              onClick={() => onEdit(user)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <BoolBadge
            value={user.aktif}
            trueLabel="Aktif"
            falseLabel="Pasif"
            trueClassName="bg-emerald-500/15 text-emerald-700"
            falseClassName="bg-red-500/15 text-red-700"
          />
          <BoolBadge
            value={user.admin}
            trueLabel="Admin"
            falseLabel="Kullanıcı"
            trueClassName="bg-primary-500/15 text-primary-700"
            falseClassName="bg-muted/20 text-muted"
          />
          {user.userTypeDescription && (
            <span className="inline-flex max-w-full items-center rounded-full bg-muted/15 px-1.5 py-px text-[10px] font-medium text-muted">
              <span className="truncate">{user.userTypeDescription}</span>
            </span>
          )}
        </div>

        {(user.email || user.tel || meta.length > 0) && (
          <dl className="mt-2 space-y-1 text-xs text-muted">
            {user.email && (
              <div>
                <dt className="sr-only">E-posta</dt>
                <dd className="break-all">{user.email}</dd>
              </div>
            )}
            {user.tel && (
              <div>
                <dt className="sr-only">Telefon</dt>
                <dd>{user.tel}</dd>
              </div>
            )}
            {meta.length > 0 && (
              <div>
                <dt className="sr-only">Organizasyon</dt>
                <dd className="break-words">{meta.join(' · ')}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </article>
  )
}

function UsersMobileList({
  data,
  onEdit,
  isUpdating,
}: {
  data: UserDto[]
  onEdit?: (user: UserDto) => void
  isUpdating?: boolean
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-white px-4 py-10 text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
          <Inbox className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm font-medium text-foreground">Kullanıcı bulunamadı</p>
        <p className="mt-1 max-w-sm text-xs text-muted">Arama kriterlerinize uygun kayıt yok.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#ececec]">
      {data.map((user) => (
        <UsersMobileCard key={user.id} user={user} onEdit={onEdit} isUpdating={isUpdating} />
      ))}
    </div>
  )
}

function UsersMobileSkeleton() {
  return (
    <div className="divide-y divide-[#ececec]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-3 px-3 py-3 sm:px-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function buildColumns(
  onEdit?: (user: UserDto) => void,
  isUpdating = false,
): TableColumn<UserDto>[] {
  return [
    {
      key: 'fotograf',
      header: 'Foto',
      className: 'w-14',
      render: (row) => (
        <UserAvatar fullName={row.fullName} fotografUrl={row.fotografUrl} cacheKey={row.id} />
      ),
    },
    {
      key: 'userName',
      header: 'Kullanıcı',
      className: 'min-w-[9rem]',
      render: (row) => (
        <span className="break-words font-medium leading-snug">{displayValue(row.userName)}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Ad Soyad',
      className: 'min-w-[10rem]',
      render: (row) => (
        <span className="break-words font-medium leading-snug">{displayValue(row.fullName)}</span>
      ),
    },
    {
      key: 'aktif',
      header: 'Durum',
      className: 'w-[5.5rem]',
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
      className: 'w-[5rem]',
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
      className: 'hidden lg:table-cell min-w-[7rem]',
      render: (row) => (
        <span className="break-words leading-snug">{displayValue(row.userTypeDescription)}</span>
      ),
    },
    {
      key: 'lokasyon',
      header: 'Lok.',
      className: 'hidden xl:table-cell min-w-[6rem]',
      render: (row) => (
        <span className="break-words leading-snug">{displayValue(row.lokasyon)}</span>
      ),
    },
    {
      key: 'departmanAdi',
      header: 'Dept.',
      className: 'hidden lg:table-cell min-w-[7rem]',
      render: (row) => (
        <span className="break-words leading-snug">{displayValue(row.departmanAdi)}</span>
      ),
    },
    {
      key: 'mintikaAdi',
      header: 'Mıntıka',
      className: 'hidden xl:table-cell min-w-[7rem]',
      render: (row) => (
        <span className="break-words leading-snug">{displayValue(row.mintikaAdi)}</span>
      ),
    },
    {
      key: 'uretimMerkeziYetki',
      header: 'Üretim Merkezi',
      className: 'hidden xl:table-cell min-w-[7rem]',
      render: (row) => (
        <BoolBadge value={row.uretimMerkeziYetki} trueLabel="Var" falseLabel="Yok" />
      ),
    },
    {
      key: 'email',
      header: 'E-posta',
      className: 'hidden md:table-cell min-w-[10rem]',
      render: (row) => <span className="break-all leading-snug">{displayValue(row.email)}</span>,
    },
    {
      key: 'tel',
      header: 'Tel',
      className: 'hidden xl:table-cell min-w-[8rem]',
      render: (row) => <span className="break-words leading-snug">{displayValue(row.tel)}</span>,
    },
    ...(onEdit
      ? [
          {
            key: 'actions',
            header: 'İşlem',
            className: 'w-[4.5rem]',
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

export function UsersTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
  onEdit,
  isUpdating = false,
}: UsersTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const columns = buildColumns(onEdit, isUpdating)

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  const visibleData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [currentPage, data, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [data])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  if (isError) {
    return (
      <ErrorState error={error} title="Kullanıcılar yüklenemedi" onRetry={onRefresh} compact />
    )
  }

  return (
    <div className="flex w-full flex-col">
      <div className="md:hidden">
        {isLoading ? (
          <UsersMobileSkeleton />
        ) : (
          <UsersMobileList data={visibleData} onEdit={onEdit} isUpdating={isUpdating} />
        )}
      </div>

      <div className="hidden md:block">
        <Table
          columns={columns}
          data={visibleData}
          keyExtractor={(row) => String(row.id)}
          getRowClassName={getUserRowClassName}
          isLoading={isLoading}
          emptyTitle="Kullanıcı bulunamadı"
          emptyMessage="Arama kriterlerinize uygun kayıt yok."
          variant="plain"
          horizontalScroll
          compact
          className="!rounded-none !border-0"
          tableClassName="min-w-[56rem]"
        />
      </div>

      {!isLoading && data.length > 0 && (
        <UsersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          visibleCount={visibleData.length}
          totalCount={data.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setCurrentPage(1)
          }}
          className="rounded-b-lg"
        />
      )}
    </div>
  )
}
