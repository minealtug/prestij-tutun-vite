import { useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/lib/api/api-error'
import { PageContainer } from '@/components/layout/PageContainer'
import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'
import { OptionGroupForm } from '../components/OptionGroupForm'
import { OptionGroupsTable } from '../components/OptionGroupsTable'
import {
  useCreateOptionGroup,
  useOptionGroups,
  useUpdateOptionGroup,
} from '../hooks/use-option-groups'
import type { SecenekGrupDto } from '../types/option-group.types'
import {
  createEmptySecenekGrupFormValues,
  formValuesToAltSecenekInputs,
  formValuesToAltSecenekUpdateInputs,
  secenekGrupToFormValues,
} from '../utils/normalize-option-group-api'

function hasValidAltSecenekler(values: ReturnType<typeof createEmptySecenekGrupFormValues>) {
  return values.altSecenekler.some((item) => item.adi.trim().length > 0)
}

export function OptionGroupsPage() {
  const { canRead, canEdit, loading: permissionLoading } = useRequirePagePermission()
  const groupsQuery = useOptionGroups()
  const createGroup = useCreateOptionGroup()
  const updateGroup = useUpdateOptionGroup()

  const [createValues, setCreateValues] = useState(createEmptySecenekGrupFormValues)
  const [editingGroup, setEditingGroup] = useState<SecenekGrupDto | null>(null)
  const [editValues, setEditValues] = useState(createEmptySecenekGrupFormValues)
  const [editError, setEditError] = useState('')
  const [createSuccessModalOpen, setCreateSuccessModalOpen] = useState(false)

  const groups = groupsQuery.data ?? []

  const canSubmitCreate = useMemo(
    () => canEdit && hasValidAltSecenekler(createValues),
    [canEdit, createValues],
  )

  const canSubmitEdit = useMemo(
    () => canEdit && editingGroup != null && hasValidAltSecenekler(editValues),
    [canEdit, editingGroup, editValues],
  )

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmitCreate) return

    const altSecenekler = formValuesToAltSecenekInputs(createValues)
    if (altSecenekler.length === 0) return

    createGroup.mutate(
      {
        grupAdi: createValues.grupAdi.trim(),
        altSecenekler,
      },
      {
        onSuccess: () => {
          setCreateValues(createEmptySecenekGrupFormValues())
          setCreateSuccessModalOpen(true)
        },
      },
    )
  }

  const openEditModal = (grup: SecenekGrupDto) => {
    if (!canEdit) return
    setEditingGroup(grup)
    setEditValues(secenekGrupToFormValues(grup))
    setEditError('')
  }

  const closeEditModal = () => {
    setEditingGroup(null)
    setEditError('')
  }

  const handleUpdate = () => {
    if (!canSubmitEdit || !editingGroup) return

    const altSecenekler = formValuesToAltSecenekUpdateInputs(editValues)
    if (altSecenekler.length === 0) return

    updateGroup.mutate(
      {
        secenekGrupId: editingGroup.secenekGrupId,
        payload: {
          grupAdi: editValues.grupAdi.trim(),
          altSecenekler,
        },
      },
      {
        onSuccess: () => closeEditModal(),
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
      <div className="space-y-6">
        <Card className="border-primary-500/15">
          <form onSubmit={handleCreate}>
            <div className="mb-5 flex items-start gap-3 border-b border-border pb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Yeni Seçenek Listesi</h3>
                <p className="mt-0.5 text-xs text-muted">
                  Sorularda kullanılacak cevap seçenek gruplarını tanımlayın.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <OptionGroupForm
                values={createValues}
                onChange={setCreateValues}
                disabled={!canEdit || createGroup.isPending}
                idPrefix="create"
              />

              <Button
                type="submit"
                fullWidth
                loading={createGroup.isPending}
                disabled={!canSubmitCreate}
              >
                <Plus className="h-4 w-4" />
                Seçenek Grubu Ekle
              </Button>

              {createGroup.isError && (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {getErrorMessage(createGroup.error)}
                </p>
              )}
            </div>
          </form>
        </Card>

        <OptionGroupsTable
          data={groups}
          isLoading={groupsQuery.isLoading}
          isError={groupsQuery.isError}
          error={groupsQuery.error}
          onRefresh={() => void groupsQuery.refetch()}
          onEdit={canEdit ? openEditModal : undefined}
        />
      </div>

      <Modal
        open={editingGroup != null}
        onClose={closeEditModal}
        title="Seçenek Grubunu Düzenle"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeEditModal}>
              İptal
            </Button>
            <Button
              type="button"
              loading={updateGroup.isPending}
              disabled={!canSubmitEdit}
              onClick={handleUpdate}
            >
              Kaydet
            </Button>
          </>
        }
      >
        <OptionGroupForm
          values={editValues}
          onChange={setEditValues}
          disabled={updateGroup.isPending}
          idPrefix="edit"
          disableGrupAdi
        />

        {editError && (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {editError}
          </p>
        )}
      </Modal>

      <Modal
        open={createSuccessModalOpen}
        onClose={() => setCreateSuccessModalOpen(false)}
        title="Eklendi"
        size="sm"
        footer={
          <div className="flex justify-end">
            <Button type="button" onClick={() => setCreateSuccessModalOpen(false)}>
              Tamam
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-sm text-foreground">Seçenek grubu başarıyla eklendi.</p>
        </div>
      </Modal>
    </PageContainer>
  )
}
