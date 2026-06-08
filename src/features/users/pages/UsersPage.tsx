import { useMemo, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/layout/PageContainer'
import { CreateUserModal } from '../components/CreateUserModal'
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
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const usersQuery = useUsers()

  const filteredUsers = useMemo(() => {
    const items = usersQuery.data ?? []
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((user) => matchesSearch(user, query))
  }, [search, usersQuery.data])

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kullanıcılar</h2>
          <p className="text-sm text-muted">GET /api/User</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4" />
          Yeni Kullanıcı
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Ad, kullanıcı adı, departman, e-posta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <UsersTable
          data={filteredUsers}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          error={usersQuery.error}
          onRefresh={() => void usersQuery.refetch()}
        />

        {usersQuery.data && (
          <p className="mt-3 text-xs text-muted">
            Gösterilen: {filteredUsers.length} / {usersQuery.data.length} kayıt
          </p>
        )}
      </Card>

      <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </PageContainer>
  )
}
