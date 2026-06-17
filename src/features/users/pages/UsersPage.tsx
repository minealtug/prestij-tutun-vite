import { useMemo, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { CreateUserModal } from '../components/CreateUserModal'
import { EditUserModal } from '../components/EditUserModal'
import { UsersTable } from '../components/UsersTable'
import { useUsers } from '../hooks/use-users'
import type { UserDto } from '../types/user.types'

function matchesSearch(user: UserDto, query: string) {
  const fields = [
    user.userName,
    user.fullName,
    user.userTypeDescription,
    user.lokasyon,
    user.departmanAdi,
    user.mintikaAdi,
    user.email,
    user.tel,
    user.aktif ? 'aktif' : 'pasif',
    user.admin ? 'admin' : '',
  ]

  return fields
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query))
}

export function UsersPage() {
  const { canRead, canEdit, loading: permissionLoading } = useRequirePagePermission()
  const [search, setSearch] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)

  const usersQuery = useUsers()

  const filteredUsers = useMemo(() => {
    const items = usersQuery.data ?? []
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((user) => matchesSearch(user, query))
  }, [search, usersQuery.data])

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yetkiler kontrol ediliyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="w-full sm:w-auto"
          disabled={!canEdit}
        >
          <UserPlus className="h-4 w-4" />
          Yeni Kullanıcı
        </Button>
      </div>

      <div className="app-table-shell !rounded-md">
        <div className="flex flex-col gap-3 border-b border-[#ececec] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="!h-9 pl-9"
              placeholder="Ad, kullanıcı adı, departman, e-posta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {usersQuery.data && (
            <p className="shrink-0 text-xs text-muted">
              Gösterilen: {filteredUsers.length} / {usersQuery.data.length} kayıt
            </p>
          )}
        </div>

        <UsersTable
          data={filteredUsers}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          error={usersQuery.error}
          onRefresh={() => void usersQuery.refetch()}
          onEdit={canEdit ? (user) => setEditingUser(user) : undefined}
        />
      </div>

      <CreateUserModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <EditUserModal
        open={editingUser != null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />
    </PageContainer>
  )
}
