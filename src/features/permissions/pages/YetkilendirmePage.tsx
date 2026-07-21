import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { ArrowLeft, Check, Plus, Shield, Trash2, UserPlus, Users, UserRoundCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Select } from '@/components/ui/Select'
import { getAssignableMenuUrlOptions } from '@/config/navigation'
import { Table, type TableColumn } from '@/components/ui/Table'
import { PageContainer } from '@/components/layout/PageContainer'
import { getErrorMessage } from '@/lib/api/api-error'
import { queryKeys } from '@/lib/query/query-keys'
import { useUsers } from '@/features/users/hooks/use-users'
import { useRequirePagePermission } from '../hooks/use-require-page-permission'
import { permissionsApi } from '../api/permissions-api'
import {
  useAddDepartmanRolYetki,
  useAddUserRolYetki,
  useCreateMenu,
  useCreateYetki,
  useDeleteMenu,
  useDeleteDepartmanRolYetki,
  useDeleteUserRolYetki,
  usePermissionDepartmans,
  usePermissionMenus,
  usePermissionYetkiler,
} from '../hooks/use-menu-yonetim'
import type { MenuAtamaDto, MenuDto } from '../types/permission.types'
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
  const deleteDepartmanRolYetki = useDeleteDepartmanRolYetki()
  const deleteUserRolYetki = useDeleteUserRolYetki()

  const [yetkiFilter, setYetkiFilter] = useState<YetkiFilter>('all')
  const [searchText, setSearchText] = useState('')
  const [menuModalOpen, setMenuModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState<MenuDto | null>(null)

  const [menuAdi, setMenuAdi] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [yetkiTuru, setYetkiTuru] = useState(YETKI_OKUMA)

  const [assignType, setAssignType] = useState<'departman' | 'user' | null>(null)
  const [assignStep, setAssignStep] = useState<'type' | 'list'>('type')
  const [selectedDepartmanIds, setSelectedDepartmanIds] = useState<number[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [initialDepartmanIds, setInitialDepartmanIds] = useState<number[]>([])
  const [initialUserIds, setInitialUserIds] = useState<number[]>([])
  const [departmanSearch, setDepartmanSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [assignError, setAssignError] = useState('')

  const filteredMenus = useMemo(() => {
    const items = menusQuery.data ?? []
    const search = searchText.trim().toLocaleLowerCase('tr-TR')
    return items.filter((menu) => {
      if (yetkiFilter !== 'all' && menu.yetkiAdi !== yetkiFilter) return false
      if (search) {
        const menuAdi = menu.menuAdi.toLocaleLowerCase('tr-TR')
        const menuUrl = menu.menuUrl.toLocaleLowerCase('tr-TR')
        if (!menuAdi.includes(search) && !menuUrl.includes(search)) return false
      }
      return true
    })
  }, [menusQuery.data, yetkiFilter, searchText])

  const departmanSecimList = useMemo(
    () =>
      (departmansQuery.data ?? [])
        .filter((d) => d.aktif && d.id != null && d.id > 0)
        .map((d) => ({ id: d.id as number, label: d.adi })),
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

  const userSecimList = useMemo(
    () =>
      (usersQuery.data ?? [])
        .filter((u) => u.aktif)
        .map((u) => ({
          id: u.id,
          label: u.fullName || u.userName,
          userName: u.userName,
        })),
    [usersQuery.data],
  )

  const filteredDepartmanSecimList = useMemo(() => {
    const query = departmanSearch.trim().toLocaleLowerCase('tr-TR')
    if (!query) return departmanSecimList
    return departmanSecimList.filter((item) =>
      item.label.toLocaleLowerCase('tr-TR').includes(query),
    )
  }, [departmanSecimList, departmanSearch])

  const filteredUserSecimList = useMemo(() => {
    const query = userSearch.trim().toLocaleLowerCase('tr-TR')
    if (!query) return userSecimList
    return userSecimList.filter(
      (item) =>
        item.label.toLocaleLowerCase('tr-TR').includes(query) ||
        item.userName.toLocaleLowerCase('tr-TR').includes(query),
    )
  }, [userSecimList, userSearch])

  const uniqueMenuUrls = useMemo(
    () =>
      [...new Set((menusQuery.data ?? []).map((menu) => normalizeUrl(menu.menuUrl)))].filter(Boolean),
    [menusQuery.data],
  )

  const menuAtamaQueries = useQueries({
    queries: uniqueMenuUrls.map((menuUrl) => ({
      queryKey: queryKeys.permissions.menuAtamalari(menuUrl),
      queryFn: () => permissionsApi.getMenuAtamalari(menuUrl),
      enabled: Boolean(menuUrl),
    })),
  })

  const menuAtamaDetailMap = useMemo(() => {
    const map = new Map<string, MenuAtamaDto[]>()
    for (let index = 0; index < menuAtamaQueries.length; index++) {
      const query = menuAtamaQueries[index]
      const menuUrl = uniqueMenuUrls[index]
      for (const atama of query.data ?? []) {
        const key =
          atama.yetkiId && atama.yetkiId > 0
            ? `yetki:${atama.yetkiId}`
            : `url:${normalizeUrl(atama.menuUrl || menuUrl)}`
        const existing = map.get(key) ?? []
        existing.push(atama)
        map.set(key, existing)
      }
    }
    return map
  }, [menuAtamaQueries, uniqueMenuUrls])

  const menuAtamaMap = useMemo(() => {
    const map = new Map<string, { departmanlar: string[]; kullanicilar: string[] }>()
    for (const [key, items] of menuAtamaDetailMap.entries()) {
      const departmanlar = [...new Set(items.map((i) => i.departmanAdi).filter(Boolean) as string[])]
      const kullanicilar = [...new Set(items.map((i) => i.userAdi).filter(Boolean) as string[])]
      map.set(key, { departmanlar, kullanicilar })
    }
    return map
  }, [menuAtamaDetailMap])

  const menuAtamalariLoading =
    uniqueMenuUrls.length > 0 &&
    menuAtamaQueries.some((query) => query.isLoading || query.isFetching)

  const isAssignSubmitDisabled = !assignType

  const getAtamalarForMenu = (menu: MenuDto): MenuAtamaDto[] => {
    const key = `yetki:${menu.yetkiId}`
    const fallbackKey = `url:${normalizeUrl(menu.menuUrl)}`
    return menuAtamaDetailMap.get(key) ?? menuAtamaDetailMap.get(fallbackKey) ?? []
  }

  const openAssignModal = (menu: MenuDto) => {
    const atamalar = getAtamalarForMenu(menu)
    setSelectedMenu(menu)
    setAssignType(null)
    setAssignStep('type')
    const departmanIds = [
      ...new Set(
        atamalar
          .map((a) => a.departmanId)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ),
    ]
    const userIds = [
      ...new Set(
        atamalar
          .map((a) => a.userId)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ),
    ]
    setInitialDepartmanIds(departmanIds)
    setInitialUserIds(userIds)
    setSelectedDepartmanIds(departmanIds)
    setSelectedUserIds(userIds)
    setDepartmanSearch('')
    setUserSearch('')
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
    if (!selectedMenu || !assignType) return
    setAssignError('')

    if (assignType === 'departman') {
      try {
        const toAdd = selectedDepartmanIds.filter((id) => !initialDepartmanIds.includes(id))
        const toDelete = initialDepartmanIds.filter((id) => !selectedDepartmanIds.includes(id))
        for (const departmanId of toAdd) {
          await addDepartmanRolYetki.mutateAsync({ departmanId, yetkiId: selectedMenu.yetkiId })
        }
        for (const departmanId of toDelete) {
          await deleteDepartmanRolYetki.mutateAsync({ departmanId, yetkiId: selectedMenu.yetkiId })
        }
        setAssignModalOpen(false)
      } catch (error) {
        setAssignError(getErrorMessage(error))
      }
      return
    }

    try {
      const toAdd = selectedUserIds.filter((id) => !initialUserIds.includes(id))
      const toDelete = initialUserIds.filter((id) => !selectedUserIds.includes(id))
      for (const userId of toAdd) {
        await addUserRolYetki.mutateAsync({ userId, yetkiId: selectedMenu.yetkiId })
      }
      for (const userId of toDelete) {
        await deleteUserRolYetki.mutateAsync({ userId, yetkiId: selectedMenu.yetkiId })
      }
      setAssignModalOpen(false)
    } catch (error) {
      setAssignError(getErrorMessage(error))
    }
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
      header: 'Yetki',
      className: 'min-w-[220px] w-[220px]',
      render: (row) => {
        const hasOther = (menusQuery.data ?? []).some(
          (m) =>
            normalizeUrl(m.menuUrl) === normalizeUrl(row.menuUrl) && m.yetkiAdi !== row.yetkiAdi,
        )

        return (
          <div className="flex min-w-[140px] flex-col items-start gap-2 py-1">
            <span className="text-xs font-medium text-foreground">{yetkiLabel(row.yetkiAdi)}</span>
            {!hasOther && (
              <Button
                size="sm"
                variant="outline"
                className="!h-6 !rounded-none border-green-600 bg-green-600 px-2 text-[11px] text-white hover:bg-green-700"
                onClick={() => void handleAddComplementaryYetki(row)}
                loading={createYetki.isPending || createMenu.isPending}
              >
                <Plus className="h-3 w-3" />
                {row.yetkiAdi === YETKI_OKUMA ? 'Düzenleme' : 'Görüntüleme'}
              </Button>
            )}
          </div>
        )
      },
    },
    {
      key: 'gruplar',
      header: 'Yetkili Gruplar',
      render: (row) => {
        const key = `yetki:${row.yetkiId}`
        const fallbackKey = `url:${normalizeUrl(row.menuUrl)}`
        const atama = menuAtamaMap.get(key) ?? menuAtamaMap.get(fallbackKey)

        return (
          <div className="max-w-[260px] text-xs leading-5 text-foreground">
            {menuAtamalariLoading ? (
              <span className="text-xs text-muted">Yükleniyor…</span>
            ) : atama?.departmanlar.length ? (
              atama.departmanlar.join(', ')
            ) : (
              <span className="text-xs text-muted">-</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'kullanicilar',
      header: 'Yetkili Personeller',
      render: (row) => {
        const key = `yetki:${row.yetkiId}`
        const fallbackKey = `url:${normalizeUrl(row.menuUrl)}`
        const atama = menuAtamaMap.get(key) ?? menuAtamaMap.get(fallbackKey)

        return (
          <div className="max-w-[260px] text-xs leading-5 text-foreground">
            {menuAtamalariLoading ? (
              <span className="text-xs text-muted">Yükleniyor…</span>
            ) : atama?.kullanicilar.length ? (
              atama.kullanicilar.join(', ')
            ) : (
              <span className="text-xs text-muted">-</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="outline"
            className="!h-7 !rounded-none border-green-600 bg-green-600 px-2 text-xs text-white hover:bg-green-700"
            onClick={() => openAssignModal(row)}
          >
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="!h-7 !w-7 !rounded-none !bg-red-500 !p-0 hover:!bg-red-600"
            onClick={() => handleDeleteMenu(row)}
            loading={deleteMenu.isPending}
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </Button>
        </div>
      ),
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

      <Card className="!rounded-none">
        <div className="mb-4 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-md">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Menü ara..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tümü' },
              { value: YETKI_OKUMA, label: 'Görüntüleme' },
              { value: YETKI_YAZMA, label: 'Düzenleme' },
            ].map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={yetkiFilter === item.value ? 'primary' : 'outline'}
                className="!rounded-none"
                onClick={() => setYetkiFilter(item.value as YetkiFilter)}
              >
                {item.label}
              </Button>
            ))}
          </div>
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
          horizontalScroll
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
        title={
          assignStep === 'type'
            ? 'Yetkilendirme Tipi'
            : assignType === 'departman'
              ? 'Grup Yetkilendirme'
              : 'Personel Yetkilendirme'
        }
        description={
          selectedMenu
            ? `${selectedMenu.menuAdi} — ${yetkiLabel(selectedMenu.yetkiAdi)}`
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            {assignStep === 'list' && (
              <Button
                variant="outline"
                onClick={() => {
                  setAssignStep('type')
                  setDepartmanSearch('')
                  setUserSearch('')
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Geri
              </Button>
            )}
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              İptal
            </Button>
            {assignStep === 'list' && (
              <Button
                onClick={() => void handleAssign()}
                loading={
                  addDepartmanRolYetki.isPending ||
                  addUserRolYetki.isPending ||
                  deleteDepartmanRolYetki.isPending ||
                  deleteUserRolYetki.isPending
                }
              >
                Kaydet
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {assignStep === 'type' ? (
            <div className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center gap-3 border border-border p-4 text-left hover:bg-muted/30"
                onClick={() => {
                  setAssignType('departman')
                  setAssignStep('list')
                  setAssignError('')
                }}
              >
                <Users className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-semibold text-foreground">Grup Yetkilendirme</p>
                  <p className="text-sm text-muted">Bu menüyü görebilecek grupları seçin</p>
                </div>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 border border-border p-4 text-left hover:bg-muted/30"
                onClick={() => {
                  setAssignType('user')
                  setAssignStep('list')
                  setAssignError('')
                }}
              >
                <UserRoundCheck className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-semibold text-foreground">Personel Yetkilendirme</p>
                  <p className="text-sm text-muted">Bu menüyü görebilecek personelleri seçin</p>
                </div>
              </button>
            </div>
          ) : assignType === 'departman' ? (
            <div className="space-y-2">
              <p className="text-sm text-muted">Bu menüyü görebilecek grupları seçin</p>
              <Input
                value={departmanSearch}
                onChange={(e) => setDepartmanSearch(e.target.value)}
                placeholder="Grup ara..."
                aria-label="Grup ara"
              />
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredDepartmanSecimList.length === 0 ? (
                  <p className="px-1 py-4 text-center text-sm text-muted">
                    Arama kriterlerinize uygun grup bulunamadı.
                  </p>
                ) : (
                  filteredDepartmanSecimList.map((item) => {
                    const checked = selectedDepartmanIds.includes(item.id)
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 border border-border px-3 py-2 hover:bg-muted/20"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedDepartmanIds((prev) =>
                              e.target.checked
                                ? [...prev, item.id]
                                : prev.filter((id) => id !== item.id),
                            )
                          }}
                        />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </label>
                    )
                  })
                )}
              </div>
              <p className="text-xs text-muted">
                <Check className="mr-1 inline h-3.5 w-3.5 text-green-600" />
                {selectedDepartmanIds.length} grup seçildi
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted">Bu menüyü görebilecek personelleri seçin</p>
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Personel ara..."
                aria-label="Personel ara"
              />
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredUserSecimList.length === 0 ? (
                  <p className="px-1 py-4 text-center text-sm text-muted">
                    Arama kriterlerinize uygun personel bulunamadı.
                  </p>
                ) : (
                  filteredUserSecimList.map((item) => {
                    const checked = selectedUserIds.includes(item.id)
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 border border-border px-3 py-2 hover:bg-muted/20"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedUserIds((prev) =>
                              e.target.checked
                                ? [...prev, item.id]
                                : prev.filter((id) => id !== item.id),
                            )
                          }}
                        />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </label>
                    )
                  })
                )}
              </div>
              <p className="text-xs text-muted">
                <Check className="mr-1 inline h-3.5 w-3.5 text-green-600" />
                {selectedUserIds.length} personel seçildi
              </p>
            </div>
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
