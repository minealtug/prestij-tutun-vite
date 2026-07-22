import { useMemo, useState } from 'react'
import { FileSpreadsheet, Search, UserPlus } from 'lucide-react'
import { Skeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import { getMintikaIdsForCografiFiltre } from '@/features/cografi-filtre/utils/cografi-filtre'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { getErrorMessage } from '@/lib/api/api-error'
import { useAuthStore } from '@/stores/auth-store'
import { CreateUserModal } from '../components/CreateUserModal'
import { EditUserModal } from '../components/EditUserModal'
import { UserMigrationConfirmModal } from '../components/UserMigrationConfirmModal'
import { UserMigrationResultModal } from '../components/UserMigrationResultModal'
import { UsersTable } from '../components/UsersTable'
import { USER_MIGRATION_DONE_KEY, useMigrateUsers } from '../hooks/use-migrate-users'
import { useUsers } from '../hooks/use-users'
import type { UserMigrationResponse } from '../types/user-migration.types'
import type { UserDto } from '../types/user.types'
import { exportUsersToExcel } from '../utils/export-users-excel'

type AktifFilter = 'all' | 'aktif' | 'pasif'

const AKTIF_FILTER_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'pasif', label: 'Pasif' },
] as const

function matchesAktifFilter(user: UserDto, filter: AktifFilter) {
  if (filter === 'aktif') return user.aktif
  if (filter === 'pasif') return !user.aktif
  return true
}

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
  const admin = useAuthStore((s) => s.user?.admin)
  const [search, setSearch] = useState('')
  const [aktifFilter, setAktifFilter] = useState<AktifFilter>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)
  const [migrationDone] = useState(() => localStorage.getItem(USER_MIGRATION_DONE_KEY) === '1')
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [migrationResult, setMigrationResult] = useState<UserMigrationResponse | null>(null)
  const [migrationError, setMigrationError] = useState<string | null>(null)

  const usersQuery = useUsers()
  const migrateMutation = useMigrateUsers()
  const cografiFiltreQuery = useCografiFiltreOptions()
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)

  const handleMigrationConfirm = () => {
    setMigrationError(null)
    setMigrationResult(null)
    migrateMutation.mutate(undefined, {
      onSuccess: (data) => {
        setConfirmModalOpen(false)
        setMigrationResult(data)
        setResultModalOpen(true)
      },
      onError: (error) => {
        setConfirmModalOpen(false)
        setMigrationError(getErrorMessage(error))
        setResultModalOpen(true)
      },
    })
  }

  const filteredUsers = useMemo(() => {
    const items = usersQuery.data ?? []
    const query = search.trim().toLowerCase()
    const options = cografiFiltreQuery.data
    const mintikaIds = options
      ? getMintikaIdsForCografiFiltre(options, geoCascade.queryParams)
      : null
    const mintikaIdSet = mintikaIds ? new Set(mintikaIds) : null

    return items.filter((user) => {
      if (mintikaIdSet && (user.mintikaId == null || !mintikaIdSet.has(user.mintikaId))) {
        return false
      }
      if (!matchesAktifFilter(user, aktifFilter)) return false
      if (query && !matchesSearch(user, query)) return false
      return true
    })
  }, [aktifFilter, cografiFiltreQuery.data, geoCascade.queryParams, search, usersQuery.data])

  const handleExportExcel = () => {
    if (filteredUsers.length === 0) return
    exportUsersToExcel(filteredUsers)
  }

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="w-full sm:w-auto"
            disabled={!canEdit}
          >
            <UserPlus className="h-4 w-4" />
            Yeni Kullanıcı
          </Button>
          {admin && !migrationDone && !migrateMutation.isSuccess && (
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => setConfirmModalOpen(true)}
            >
              Kullanıcı migrasyonu + şifre ata
            </Button>
          )}
        </div>
      </div>

      <div className="w-full overflow-visible rounded-lg border border-[#e8ecf0] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#ececec] px-3 py-3 sm:px-4">
          {cografiFiltreQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <CografiFiltreFields
              values={geoCascade.values}
              selectOptions={geoCascade.selectOptions}
              onMenseiChange={geoCascade.setMenseiId}
              onBolgeChange={geoCascade.setBolgeId}
              onMintikaChange={geoCascade.setMintikaId}
              onAlimNoktasiChange={geoCascade.setAlimNoktasiId}
              onKoyChange={geoCascade.setKoyId}
            />
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 w-full sm:max-w-[9.5rem]">
                <Select
                  label="Durum"
                  value={aktifFilter}
                  onChange={(e) => setAktifFilter(e.target.value as AktifFilter)}
                  options={[...AKTIF_FILTER_OPTIONS]}
                />
              </div>
              <div className="relative min-w-0 flex-1 sm:max-w-lg">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  className="!h-9 pl-9"
                  placeholder="Ad, kullanıcı adı, departman..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              {usersQuery.data && (
                <p className="text-xs text-muted sm:text-right">
                  Gösterilen: {filteredUsers.length} / {usersQuery.data.length} kayıt
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-600 bg-transparent text-green-700 hover:bg-green-50 sm:w-auto"
                onClick={handleExportExcel}
                disabled={usersQuery.isLoading || filteredUsers.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden />
                Excel'e Aktar
              </Button>
            </div>
          </div>
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
      <UserMigrationConfirmModal
        open={confirmModalOpen}
        loading={migrateMutation.isPending}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleMigrationConfirm}
      />
      <UserMigrationResultModal
        open={resultModalOpen}
        result={migrationResult}
        error={migrationError}
        onClose={() => setResultModalOpen(false)}
      />
    </PageContainer>
  )
}
