import { useMemo, useState } from 'react'
import { Skeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { PageContainer } from '@/components/layout/PageContainer'
import { CografiFiltreFields } from '@/features/cografi-filtre/components/CografiFiltreFields'
import { useCografiFiltreCascade } from '@/features/cografi-filtre/hooks/use-cografi-filtre-cascade'
import { useCografiFiltreOptions } from '@/features/cografi-filtre/hooks/use-cografi-filtre-options'
import type { CografiFiltreQueryParams } from '@/features/cografi-filtre/types'
import { hasCografiFiltreSelection } from '@/features/cografi-filtre/types'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { getErrorMessage } from '@/lib/api/api-error'
import { EkiciDefinitionForm } from '../components/EkiciDefinitionForm'
import { EkiciDefinitionsTable } from '../components/EkiciDefinitionsTable'
import {
  useCreateEkiciDefinition,
  useEkiciDefinitions,
  useUpdateEkiciDefinition,
} from '../hooks/use-ekici-definitions'
import type { EkiciDefinitionDto } from '../types/ekici-definition.types'
import {
  createEmptyEkiciFormValues,
  ekiciDefinitionToFormValues,
  getEkiciFullName,
} from '../utils/normalize-ekici-definition-api'
import {
  formatEkiciDisplayText,
  getEkiciFullNameDisplay,
} from '../utils/format-ekici-display-text'

type AktifFilter = 'all' | 'aktif' | 'pasif'

const AKTIF_FILTER_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'pasif', label: 'Pasif' },
] as const

function matchesAktifFilter(ekici: EkiciDefinitionDto, filter: AktifFilter) {
  if (filter === 'aktif') return ekici.aktif === 1
  if (filter === 'pasif') return ekici.aktif !== 1
  return true
}

function toViewFormValues(ekici: EkiciDefinitionDto) {
  const values = ekiciDefinitionToFormValues(ekici)
  return {
    ...values,
    ad: formatEkiciDisplayText(values.ad) || values.ad,
    soyad: formatEkiciDisplayText(values.soyad) || values.soyad,
    babaAdi: formatEkiciDisplayText(values.babaAdi) || values.babaAdi,
    anaAdi: formatEkiciDisplayText(values.anaAdi) || values.anaAdi,
    dogumYeri: formatEkiciDisplayText(values.dogumYeri) || values.dogumYeri,
    cinsiyet: values.cinsiyet || '—',
  }
}

function matchesEkiciSearch(ekici: EkiciDefinitionDto, query: string) {
  const fields = [
    getEkiciFullName(ekici),
    ekici.tcKimlikNo,
    ekici.ad,
    ekici.soyad,
    ekici.babaAdi,
    String(ekici.yil),
    ekici.menseiAdi,
    ekici.bolgeAdi,
    ekici.mintikaAdi,
    ekici.alimNoktasiAdi,
    ekici.koyAdi,
    ekici.makineKodu,
    ekici.aktif === 1 ? 'evet' : 'hayır',
  ]

  return fields
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase('tr-TR').includes(query))
}

function matchesCografiFiltre(
  ekici: EkiciDefinitionDto,
  params: CografiFiltreQueryParams,
): boolean {
  if (params.menseiId != null && ekici.menseiId !== params.menseiId) return false
  if (params.bolgeId != null && ekici.bolgeId !== params.bolgeId) return false
  if (params.mintikaId != null && ekici.mintikaId !== params.mintikaId) return false
  if (params.alimNoktasiId != null && ekici.alimNoktasiId !== params.alimNoktasiId) {
    return false
  }
  if (params.koyId != null && ekici.koyId !== params.koyId) return false
  return true
}

function isFormValid(values: ReturnType<typeof createEmptyEkiciFormValues>) {
  return (
    values.tcKimlikNo.trim().length > 0 &&
    values.ad.trim().length > 0 &&
    values.soyad.trim().length > 0 &&
    values.babaAdi.trim().length > 0 &&
    values.makineKodu.trim().length > 0 &&
    values.dogumTarihi.trim().length > 0 &&
    values.mintikaId > 0 &&
    values.bolgeId > 0 &&
    values.menseiId > 0 &&
    values.alimNoktasiId > 0 &&
    values.koyId > 0 &&
    values.uretimMerkeziId > 0
  )
}

export function EkiciDefinitionsPage() {
  const { canRead, canEdit, loading: permissionLoading } = useRequirePagePermission()
  const ekicilerQuery = useEkiciDefinitions()
  const createEkici = useCreateEkiciDefinition()
  const updateEkici = useUpdateEkiciDefinition()
  const cografiFiltreQuery = useCografiFiltreOptions()
  const geoCascade = useCografiFiltreCascade(cografiFiltreQuery.data)

  const [search, setSearch] = useState('')
  const [aktifFilter, setAktifFilter] = useState<AktifFilter>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createValues, setCreateValues] = useState(createEmptyEkiciFormValues)
  const [createError, setCreateError] = useState('')

  const [viewingEkici, setViewingEkici] = useState<EkiciDefinitionDto | null>(null)
  const [editingEkici, setEditingEkici] = useState<EkiciDefinitionDto | null>(null)
  const [editValues, setEditValues] = useState(createEmptyEkiciFormValues)
  const [editError, setEditError] = useState('')

  const hasGeoFilter = hasCografiFiltreSelection(geoCascade.queryParams)
  const hasAktifFilter = aktifFilter !== 'all'

  const filteredEkiciler = useMemo(() => {
    const items = ekicilerQuery.data ?? []
    const query = search.trim().toLocaleLowerCase('tr-TR')

    return items.filter((ekici) => {
      if (hasGeoFilter && !matchesCografiFiltre(ekici, geoCascade.queryParams)) {
        return false
      }
      if (!matchesAktifFilter(ekici, aktifFilter)) return false
      if (query && !matchesEkiciSearch(ekici, query)) return false
      return true
    })
  }, [aktifFilter, ekicilerQuery.data, geoCascade.queryParams, hasGeoFilter, search])

  const tableEmptyMessage =
    search.trim().length > 0 || hasGeoFilter || hasAktifFilter
      ? 'Arama kriterlerinize uygun ekici kaydı bulunamadı.'
      : 'Henüz ekici kaydı bulunmuyor.'

  const uretimMerkeziOptions = useMemo(() => {
    const ids = new Set<number>()
    for (const ekici of ekicilerQuery.data ?? []) {
      if (ekici.uretimMerkeziId > 0) ids.add(ekici.uretimMerkeziId)
    }
    return [...ids]
      .sort((a, b) => a - b)
      .map((id) => ({
        value: String(id),
        label: `Üretim Merkezi ${id}`,
      }))
  }, [ekicilerQuery.data])

  const openCreateModal = () => {
    if (!canEdit) return
    setCreateValues(createEmptyEkiciFormValues())
    setCreateError('')
    setCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setCreateModalOpen(false)
    setCreateError('')
  }

  const handleCreate = () => {
    if (!canEdit || !isFormValid(createValues)) return

    setCreateError('')
    createEkici.mutate(createValues, {
      onSuccess: () => closeCreateModal(),
      onError: (error) => setCreateError(getErrorMessage(error)),
    })
  }

  const openView = (ekici: EkiciDefinitionDto) => {
    setViewingEkici(ekici)
  }

  const closeView = () => {
    setViewingEkici(null)
  }

  const openEdit = (ekici: EkiciDefinitionDto) => {
    if (!canEdit) return
    setEditingEkici(ekici)
    setEditValues(ekiciDefinitionToFormValues(ekici))
    setEditError('')
  }

  const closeEdit = () => {
    setEditingEkici(null)
    setEditError('')
  }

  const handleUpdate = () => {
    if (!canEdit || !editingEkici || !isFormValid(editValues)) return

    setEditError('')
    updateEkici.mutate(
      { id: editingEkici.id, payload: editValues },
      {
        onSuccess: () => closeEdit(),
        onError: (error) => setEditError(getErrorMessage(error)),
      },
    )
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
      <div className="app-table-shell !rounded-md">
        <div className="flex flex-col gap-3 border-b border-[#ececec] px-4 py-3">
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
              <div className="min-w-0 flex-1 sm:max-w-lg">
                <Input
                  className="!h-9"
                  placeholder="Ad, soyad, TC, bölge, mıntıka, köy..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Ekici ara"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:pb-0.5">
              {ekicilerQuery.data && (
                <p className="shrink-0 text-xs text-muted">
                  Gösterilen: {filteredEkiciler.length} / {ekicilerQuery.data.length} kayıt
                </p>
              )}
              {canEdit && (
                <Button onClick={openCreateModal}>
                  Yeni Ekici
                </Button>
              )}
            </div>
          </div>
        </div>

        <EkiciDefinitionsTable
          data={filteredEkiciler}
          isLoading={ekicilerQuery.isLoading}
          isError={ekicilerQuery.isError}
          error={ekicilerQuery.error}
          onRefresh={() => void ekicilerQuery.refetch()}
          onView={openView}
          onEdit={canEdit ? openEdit : undefined}
          isUpdating={updateEkici.isPending}
          emptyMessage={tableEmptyMessage}
        />
      </div>

      <Modal
        open={createModalOpen}
        onClose={closeCreateModal}
        title="Yeni Ekici"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeCreateModal}>
              İptal
            </Button>
            <Button
              onClick={handleCreate}
              loading={createEkici.isPending}
              disabled={!isFormValid(createValues)}
            >
              Ekici Ekle
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <EkiciDefinitionForm
            values={createValues}
            onChange={setCreateValues}
            disabled={createEkici.isPending}
            idPrefix="create-ekici"
            uretimMerkeziOptions={uretimMerkeziOptions}
          />
          {(createEkici.isError || createError) && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {createError || getErrorMessage(createEkici.error)}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(viewingEkici)}
        onClose={closeView}
        size="xl"
        title={viewingEkici ? `${getEkiciFullNameDisplay(viewingEkici)} — Detay` : 'Ekici Detayı'}
        description={
          viewingEkici?.kaynak === 'LegacyDb'
            ? 'Legacy veritabanı kaydı — salt okunur.'
            : 'Ekici kayıt detayları.'
        }
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={closeView}>
              Kapat
            </Button>
          </div>
        }
      >
        {viewingEkici && (
          <EkiciDefinitionForm
            values={toViewFormValues(viewingEkici)}
            onChange={() => {}}
            disabled
            idPrefix="view-ekici"
            uretimMerkeziOptions={uretimMerkeziOptions}
            locationLabels={{
              menseiAdi: viewingEkici.menseiAdi,
              bolgeAdi: viewingEkici.bolgeAdi,
              mintikaAdi: viewingEkici.mintikaAdi,
              alimNoktasiAdi: viewingEkici.alimNoktasiAdi,
              koyAdi: viewingEkici.koyAdi,
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(editingEkici)}
        onClose={closeEdit}
        size="xl"
        title={editingEkici ? `${getEkiciFullNameDisplay(editingEkici)} — Düzenle` : 'Ekici Düzenle'}
        description={
          editingEkici?.kaynak === 'LegacyDb'
            ? 'Legacy kayıt değiştirilmez; güncel hali uygulama veritabanına kaydedilir.'
            : 'Ekici kaydını güncelleyin.'
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeEdit}>
              İptal
            </Button>
            <Button
              onClick={handleUpdate}
              loading={updateEkici.isPending}
              disabled={!isFormValid(editValues)}
            >
              Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <EkiciDefinitionForm
            values={editValues}
            onChange={setEditValues}
            disabled={updateEkici.isPending}
            idPrefix="edit-ekici"
            uretimMerkeziOptions={uretimMerkeziOptions}
            locationLabels={
              editingEkici
                ? {
                    menseiAdi: editingEkici.menseiAdi,
                    bolgeAdi: editingEkici.bolgeAdi,
                    mintikaAdi: editingEkici.mintikaAdi,
                    alimNoktasiAdi: editingEkici.alimNoktasiAdi,
                    koyAdi: editingEkici.koyAdi,
                  }
                : undefined
            }
          />
          {(updateEkici.isError || editError) && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {editError || getErrorMessage(updateEkici.error)}
            </p>
          )}
        </div>
      </Modal>
    </PageContainer>
  )
}
