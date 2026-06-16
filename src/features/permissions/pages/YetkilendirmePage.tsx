import { useMemo, useState } from 'react'
import { Plus, Shield, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Select } from '@/components/ui/Select'
import { getAssignableMenuUrlOptions } from '@/config/navigation'
import { resolveDepartmanId } from '@/features/users/utils/resolve-departman-id'
import { buildDepartmanAdiOptions } from '../utils/departman-options'
import { Table, type TableColumn } from '@/components/ui/Table'
import { PageContainer } from '@/components/layout/PageContainer'
import { getErrorMessage } from '@/lib/api/api-error'
import { useUsers } from '@/features/users/hooks/use-users'
import { useRequirePagePermission } from '../hooks/use-require-page-permission'
import {
  useAddDepartmanRolYetki,
  useAddUserRolYetki,
  useCreateMenu,
  useCreateYetki,
  useDeleteMenu,
  usePermissionDepartmans,
  usePermissionMenus,
  usePermissionYetkiler,
} from '../hooks/use-menu-yonetim'
import type { MenuDto } from '../types/permission.types'
import { YETKI_OKUMA, YETKI_YAZMA } from '../types/permission.types'
import { normalizeUrl } from '../utils/permission-logic'

type YetkiFilter = 'all' | 'Okuma' | 'Yazma'

function yetkiLabel(turu: string) {
  if (turu === YETKI_OKUMA) return 'Görüntüleme'
  if (turu === YETKI_YAZMA) return 'Düzenleme'
  return turu
}

export function YetkilendirmePage() {
  const { canRead, loading: permissionLoading } = useRequirePagePermission()
  const menusQuery = usePermissionMenus()
  const yetkilerQuery = usePermissionYetkiler()
  const departmansQuery = usePermissionDepartmans()
  const usersQuery = useUsers()

  const createYetki = useCreateYetki()
  const createMenu = useCreateMenu()
  const deleteMenu = useDeleteMenu()
  const addDepartmanRolYetki = useAddDepartmanRolYetki()
  const addUserRolYetki = useAddUserRolYetki()

  const [yetkiFilter, setYetkiFilter] = useState<YetkiFilter>('all')
  const [menuModalOpen, setMenuModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState<MenuDto | null>(null)

  const [menuAdi, setMenuAdi] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [yetkiTuru, setYetkiTuru] = useState(YETKI_OKUMA)

  const [assignType, setAssignType] = useState<'departman' | 'user'>('departman')
  const [assignDepartmanAdi, setAssignDepartmanAdi] = useState('')
  const [assignUserId, setAssignUserId] = useState('')
  const [assignError, setAssignError] = useState('')
  const [isResolvingDepartman, setIsResolvingDepartman] = useState(false)

  const filteredMenus = useMemo(() => {
    const items = menusQuery.data ?? []
    return items.filter((menu) => {
      if (yetkiFilter !== 'all' && menu.yetkiAdi !== yetkiFilter) return false
      return true
    })
  }, [menusQuery.data, yetkiFilter])

  const departmanOptions = useMemo(
    () => buildDepartmanAdiOptions(departmansQuery.data ?? []),
    [departmansQuery.data],
  )

  const menuUrlOptions = useMemo(() => {
    const assignedUrls = new Set(
      (menusQuery.data ?? []).map((menu) => normalizeUrl(menu.menuUrl)),
    )
    return getAssignableMenuUrlOptions().filter(
      (option) => !assignedUrls.has(normalizeUrl(option.value)),
    )
  }, [menusQuery.data])

  const userOptions = useMemo(
    () =>
      (usersQuery.data ?? [])
        .filter((u) => u.aktif)
        .map((u) => ({ value: String(u.id), label: `${u.fullName} (${u.userName})` })),
    [usersQuery.data],
  )

  const isAssignSubmitDisabled =
    assignType === 'departman' ? !assignDepartmanAdi.trim() : !assignUserId

  const openAssignModal = (menu: MenuDto) => {
    setSelectedMenu(menu)
    setAssignType('departman')
    setAssignDepartmanAdi('')
    setAssignUserId('')
    setAssignError('')
    setAssignModalOpen(true)
  }

  const handleCreateMenu = async () => {
    if (!menuAdi.trim() || !menuUrl.trim()) return

    const yetki = await createYetki.mutateAsync({ yetkiTuru })
    await createMenu.mutateAsync({
      menuAdi: menuAdi.trim(),
      menuUrl: normalizeUrl(menuUrl.trim()),
      yetkiId: yetki.id,
    })

    setMenuModalOpen(false)
    setMenuAdi('')
    setMenuUrl('')
    setYetkiTuru(YETKI_OKUMA)
  }

  const handleAddComplementaryYetki = async (menu: MenuDto) => {
    const otherTuru = menu.yetkiAdi === YETKI_OKUMA ? YETKI_YAZMA : YETKI_OKUMA
    const sameUrlMenus = (menusQuery.data ?? []).filter(
      (m) => normalizeUrl(m.menuUrl) === normalizeUrl(menu.menuUrl),
    )
    if (sameUrlMenus.some((m) => m.yetkiAdi === otherTuru)) return

    const yetki = await createYetki.mutateAsync({ yetkiTuru: otherTuru })
    await createMenu.mutateAsync({
      menuAdi: menu.menuAdi,
      menuUrl: normalizeUrl(menu.menuUrl),
      yetkiId: yetki.id,
    })
  }

  const handleAssign = async () => {
    if (!selectedMenu) return
    setAssignError('')

    if (assignType === 'departman') {
      const adi = assignDepartmanAdi.trim()
      if (!adi) return

      setIsResolvingDepartman(true)
      try {
        const departmanId = await resolveDepartmanId(adi)
        if (!departmanId) {
          setAssignError('Departman kaydı oluşturulamadı. Lütfen tekrar deneyin.')
          return
        }

        await addDepartmanRolYetki.mutateAsync({
          departmanId,
          yetkiId: selectedMenu.yetkiId,
        })
        setAssignModalOpen(false)
      } catch (error) {
        setAssignError(getErrorMessage(error))
      } finally {
        setIsResolvingDepartman(false)
      }
      return
    }

    const userId = Number(assignUserId)
    if (!userId) return
    addUserRolYetki.mutate(
      { userId, yetkiId: selectedMenu.yetkiId },
      {
        onSuccess: () => setAssignModalOpen(false),
        onError: (error) => setAssignError(getErrorMessage(error)),
      },
    )
  }

  const handleDeleteMenu = (menu: MenuDto) => {
    if (!window.confirm(`"${menu.menuAdi}" menüsünü silmek istediğinize emin misiniz?`)) return
    deleteMenu.mutate(menu.id)
  }

  const columns: TableColumn<MenuDto>[] = [
    {
      key: 'menuAdi',
      header: 'Menü',
      render: (row) => (
        <div>
          <p className="text-xs font-medium leading-snug text-foreground">{row.menuAdi}</p>
          <p className="text-[11px] leading-snug text-muted">{row.menuUrl}</p>
        </div>
      ),
    },
    {
      key: 'yetki',
      header: 'Yetki Türü',
      render: (row) => (
        <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-700">
          {yetkiLabel(row.yetkiAdi)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (row) => {
        const hasOther = (menusQuery.data ?? []).some(
          (m) =>
            normalizeUrl(m.menuUrl) === normalizeUrl(row.menuUrl) && m.yetkiAdi !== row.yetkiAdi,
        )
        return (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" className="!h-7 px-2 text-xs" onClick={() => openAssignModal(row)}>
              <UserPlus className="h-3.5 w-3.5" />
              Ata
            </Button>
            {!hasOther && (
              <Button
                size="sm"
                variant="outline"
                className="!h-7 px-2 text-xs"
                onClick={() => void handleAddComplementaryYetki(row)}
                loading={createYetki.isPending || createMenu.isPending}
              >
                <Plus className="h-3.5 w-3.5" />
                {row.yetkiAdi === YETKI_OKUMA ? 'Düzenleme Ekle' : 'Görüntüleme Ekle'}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="!h-7 !w-7 !p-0"
              onClick={() => handleDeleteMenu(row)}
              loading={deleteMenu.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        )
      },
    },
  ]

  if (permissionLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Yetkiler yükleniyor…</p>
      </PageContainer>
    )
  }

  if (!canRead) return null

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Shield className="h-5 w-5 text-primary-600" />
            Yetkilendirme
          </h2>
          <p className="text-sm text-muted">Menü URL, yetki türü ve departman/kullanıcı atamaları</p>
        </div>
        <Button
          onClick={() => {
            setMenuAdi('')
            setMenuUrl('')
            setYetkiTuru(YETKI_OKUMA)
            setMenuModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Yeni Menü
        </Button>
      </div>

      <Card>
        <div className="mb-4 w-full">
          <Select
            label="Yetki filtresi"
            value={yetkiFilter}
            onChange={(e) => setYetkiFilter(e.target.value as YetkiFilter)}
            options={[
              { value: 'all', label: 'Tümü' },
              { value: YETKI_OKUMA, label: 'Görüntüleme' },
              { value: YETKI_YAZMA, label: 'Düzenleme' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          data={filteredMenus}
          keyExtractor={(row) => String(row.id)}
          isLoading={menusQuery.isLoading || yetkilerQuery.isLoading}
          emptyTitle="Menü kaydı yok"
          emptyMessage="Yeni menü ekleyerek başlayın."
          variant="plain"
          compact
          horizontalScroll={false}
          className="!rounded-none !border-0"
          pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
        />
      </Card>

      <Modal
        open={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        title="Yeni Menü"
        description="Sayfa rotası ve yetki türü tanımlayın"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMenuModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => void handleCreateMenu()}
              loading={createYetki.isPending || createMenu.isPending}
              disabled={!menuAdi.trim() || !menuUrl.trim()}
            >
              Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Menü Adı"
            value={menuAdi}
            onChange={(e) => setMenuAdi(e.target.value)}
            placeholder="Örn: Soru Ekleme"
          />
          <SearchableSelect
            label="Menü URL"
            value={menuUrl}
            onChange={(value) => {
              setMenuUrl(value)
              const option = menuUrlOptions.find((item) => item.value === value)
              if (option) setMenuAdi(option.label)
            }}
            options={menuUrlOptions}
            placeholder="Sayfa seçin..."
            emptyMessage="Sayfa bulunamadı"
            disabled={menuUrlOptions.length === 0}
          />
          {menuUrlOptions.length === 0 && (
            <p className="text-sm text-muted">Tüm sayfalar için menü tanımlandı.</p>
          )}
          <Select
            label="Yetki Türü"
            value={yetkiTuru}
            onChange={(e) => setYetkiTuru(e.target.value)}
            options={[
              { value: YETKI_OKUMA, label: 'Görüntüleme (Okuma)' },
              { value: YETKI_YAZMA, label: 'Düzenleme (Yazma)' },
            ]}
          />
          {(createYetki.isError || createMenu.isError) && (
            <p className="text-sm text-red-600" role="alert">
              {getErrorMessage(createYetki.error ?? createMenu.error)}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Yetki Ata"
        description={
          selectedMenu
            ? `${selectedMenu.menuAdi} — ${yetkiLabel(selectedMenu.yetkiAdi)}`
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => void handleAssign()}
              loading={
                isResolvingDepartman ||
                addDepartmanRolYetki.isPending ||
                addUserRolYetki.isPending
              }
              disabled={isAssignSubmitDisabled}
            >
              Ata
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <SearchableSelect
            label="Atama Türü"
            value={assignType}
            onChange={(value) => {
              setAssignType(value as 'departman' | 'user')
              setAssignError('')
            }}
            options={[
              { value: 'departman', label: 'Departman' },
              { value: 'user', label: 'Kullanıcı' },
            ]}
            placeholder="Atama türü seçin..."
          />
          {assignType === 'departman' ? (
            <SearchableSelect
              label="Departman"
              value={assignDepartmanAdi}
              onChange={setAssignDepartmanAdi}
              options={departmanOptions}
              placeholder="Departman ara veya seç..."
              emptyMessage="Departman bulunamadı"
              disabled={departmansQuery.isLoading}
            />
          ) : (
            <SearchableSelect
              label="Kullanıcı"
              value={assignUserId}
              onChange={setAssignUserId}
              options={userOptions}
              placeholder="Kullanıcı ara veya seç..."
              emptyMessage="Kullanıcı bulunamadı"
              disabled={usersQuery.isLoading}
            />
          )}
          {assignType === 'departman' && departmansQuery.isLoading && (
            <p className="text-sm text-muted">Departmanlar yükleniyor…</p>
          )}
          {assignType === 'user' && usersQuery.isLoading && (
            <p className="text-sm text-muted">Kullanıcılar yükleniyor…</p>
          )}
          {assignError && (
            <p className="text-sm text-red-600" role="alert">
              {assignError}
            </p>
          )}
        </div>
      </Modal>
    </PageContainer>
  )
}
