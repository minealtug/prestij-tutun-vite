import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { getErrorMessage } from '@/lib/api/api-error'
import {
  useCreateUser,
  useDepartmans,
  useMintikas,
  useUsers,
  useUserTypes,
} from '../hooks/use-users'
import {
  defaultCreateUserFormState,
  type CreateUserFormErrors,
  type CreateUserFormState,
} from '../types/user.types'
import { departmanAdlariToSelectOptions } from '../utils/departman-options'
import { validateCreateUserForm } from '../utils/validate-create-user'

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  )
}

export function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const createUser = useCreateUser()
  const usersQuery = useUsers()
  const userTypesQuery = useUserTypes()
  const departmansQuery = useDepartmans(open)
  const mintikasQuery = useMintikas()

  const [form, setForm] = useState<CreateUserFormState>(defaultCreateUserFormState)
  const [errors, setErrors] = useState<CreateUserFormErrors>({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(defaultCreateUserFormState)
    setErrors({})
    setSubmitError('')
  }, [open])

  const userTypeOptions = useMemo(
    () => [
      { value: '', label: 'Kullanıcı tipi seçin' },
      ...(userTypesQuery.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.description,
      })),
    ],
    [userTypesQuery.data],
  )

  const departmanOptions = useMemo(
    () => departmanAdlariToSelectOptions(departmansQuery.data ?? []),
    [departmansQuery.data],
  )

  const mintikaOptions = useMemo(
    () => [
      { value: '', label: 'Mıntıka seçin (opsiyonel)' },
      ...(mintikasQuery.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.adi,
      })),
    ],
    [mintikasQuery.data],
  )

  const supervisorOptions = useMemo(
    () =>
      (usersQuery.data ?? []).map((user) => ({
        value: String(user.id),
        label: `${user.fullName} (${user.userName})`,
        key: String(user.id),
      })),
    [usersQuery.data],
  )

  const updateField = <K extends keyof CreateUserFormState>(
    key: K,
    value: CreateUserFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setSubmitError('')
  }

  const handleClose = () => {
    if (createUser.isPending) return
    onClose()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const nextErrors = validateCreateUserForm(form)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    createUser.mutate(form, {
      onSuccess: () => onClose(),
      onError: (error) => setSubmitError(getErrorMessage(error)),
    })
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Yeni kullanıcı"
      description="Zorunlu alanlar * ile işaretlenmiştir."
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleClose} disabled={createUser.isPending}>
            İptal
          </Button>
          <Button type="submit" form="create-user-form" disabled={createUser.isPending}>
            {createUser.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      }
    >
      <form
        id="create-user-form"
        onSubmit={handleSubmit}
        className="max-h-[min(68vh,640px)] space-y-5 overflow-y-auto pr-1"
        noValidate
      >
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Kimlik</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Kullanıcı adı *"
              value={form.userName}
              onChange={(e) => updateField('userName', e.target.value)}
              error={errors.userName}
              autoComplete="username"
              required
            />
            <Input
              label="Ad soyad *"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              error={errors.fullName}
              autoComplete="name"
              required
            />
          </div>
          <Input
            label="Şifre *"
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Kullanıcı tipi *"
              value={form.userTypeId}
              onChange={(e) => updateField('userTypeId', e.target.value)}
              options={userTypeOptions}
              error={errors.userTypeId}
              disabled={userTypesQuery.isLoading}
              required
            />
            <Input
              label="Sigorta numarası"
              value={form.insuranceNumber}
              onChange={(e) => updateField('insuranceNumber', e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">İletişim</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="E-posta"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Telefon"
              type="tel"
              value={form.tel}
              onChange={(e) => updateField('tel', e.target.value)}
              autoComplete="tel"
            />
          </div>
          <Input
            label="Lokasyon"
            value={form.lokasyon}
            onChange={(e) => updateField('lokasyon', e.target.value)}
            placeholder="Örn. Depo"
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Organizasyon</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <SearchableSelect
              label="Departman"
              value={form.departmanAdi}
              onChange={(value) => updateField('departmanAdi', value)}
              options={departmanOptions}
              placeholder={
                departmansQuery.isLoading ? 'Departmanlar yükleniyor...' : 'Departman ara veya seç...'
              }
              emptyMessage="Departman bulunamadı"
              disabled={departmansQuery.isLoading || departmansQuery.isError}
            />
            <Select
              label="Mıntıka"
              value={form.mintikaId}
              onChange={(e) => updateField('mintikaId', e.target.value)}
              options={mintikaOptions}
              disabled={mintikasQuery.isLoading}
            />
          </div>
          <SearchableSelect
            label="Amir (supervisor)"
            value={form.supervisorUserId}
            onChange={(value) => updateField('supervisorUserId', value)}
            options={supervisorOptions}
            placeholder="Amir ara veya seç..."
            disabled={usersQuery.isLoading}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Yetkiler</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckboxField
              label="Admin"
              checked={form.admin}
              onChange={(checked) => updateField('admin', checked)}
            />
            <CheckboxField
              label="Aktif"
              checked={form.aktif}
              onChange={(checked) => updateField('aktif', checked)}
            />
            <CheckboxField
              label="Üretim merkezi yetkisi"
              checked={form.uretimMerkeziYetki}
              onChange={(checked) => updateField('uretimMerkeziYetki', checked)}
            />
            <CheckboxField
              label="İcra ödeme uyarısı"
              checked={form.icraOdemeUyari}
              onChange={(checked) => updateField('icraOdemeUyari', checked)}
            />
          </div>
        </section>

        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        )}
      </form>
    </Modal>
  )
}
