import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { useUsers } from '../hooks/use-users'
import type { UserDto } from '../types/user.types'

const columns: TableColumn<UserDto>[] = [
  {
    key: 'fullName',
    header: 'Ad Soyad',
    render: (row) => (
      <div>
        <p className="font-medium">{row.fullName}</p>
        <p className="text-xs text-muted">{row.email}</p>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Rol',
    render: (row) => (
      <span className="inline-flex rounded-full bg-accent-500/20 px-2.5 py-0.5 text-xs font-medium text-primary-800">
        {row.role}
      </span>
    ),
  },
  {
    key: 'isActive',
    header: 'Durum',
    render: (row) => (
      <span className={row.isActive ? 'text-primary-600' : 'text-muted'}>
        {row.isActive ? 'Aktif' : 'Pasif'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Kayıt',
    render: (row) => new Date(row.createdAt).toLocaleDateString('tr-TR'),
  },
]

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const usersQuery = useUsers({ page: 1, pageSize: 20, search: search || undefined })

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kullanıcılar</h2>
          <p className="text-sm text-muted">GET /api/users — sayfalı liste</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Yeni Kullanıcı
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {usersQuery.isError ? (
          <ErrorState
            error={usersQuery.error}
            title="Kullanıcılar yüklenemedi"
            onRetry={() => void usersQuery.refetch()}
            compact
          />
        ) : (
          <Table
            columns={columns}
            data={usersQuery.data?.items ?? []}
            keyExtractor={(row) => row.id}
            isLoading={usersQuery.isLoading}
            emptyTitle="Kullanıcı bulunamadı"
            emptyMessage="API bağlandığında kullanıcılar listelenecek."
          />
        )}

        {usersQuery.data && (
          <p className="mt-3 text-xs text-muted">Toplam: {usersQuery.data.totalCount} kayıt</p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni kullanıcı"
        description="Backend hazır olduğunda POST /api/users ile entegre edilecek."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={() => setModalOpen(false)}>Kaydet</Button>
          </div>
        }
      >
        <p className="text-sm text-muted">
          Form alanları .NET API sözleşmesi netleşince eklenecektir.
        </p>
      </Modal>
    </PageContainer>
  )
}
