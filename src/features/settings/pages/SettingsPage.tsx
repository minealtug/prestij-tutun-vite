import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { QueryBoundary } from '@/components/feedback/QueryBoundary'
import { PageContainer } from '@/components/layout/PageContainer'
import { getErrorMessage } from '@/lib/api/api-error'
import { useAuthStore } from '@/stores/auth-store'
import { useSettingsProfile, useUpdateSettings } from '../hooks/use-settings'

export function SettingsPage() {
  const authUser = useAuthStore((s) => s.user)
  const profileQuery = useSettingsProfile()
  const updateMutation = useUpdateSettings()

  const profile = profileQuery.data
  const [fullName, setFullName] = useState('')
  const [language, setLanguage] = useState('tr-TR')
  const [notifications, setNotifications] = useState(true)
  const [dirty, setDirty] = useState(false)

  const displayName = dirty ? fullName : (profile?.fullName ?? authUser?.fullName ?? '')
  const displayLanguage = dirty ? language : (profile?.language ?? 'tr-TR')
  const displayNotifications = dirty ? notifications : (profile?.notificationsEnabled ?? true)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      fullName: displayName,
      language: displayLanguage,
      notificationsEnabled: displayNotifications,
    })
    setDirty(false)
  }

  const markDirty = () => setDirty(true)

  return (
    <PageContainer className="mx-auto max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Ayarlar</h2>
        <p className="text-sm text-muted">GET/PUT /api/settings/profile</p>
      </div>

      <QueryBoundary
        query={profileQuery}
        loadingLabel="Ayarlar yükleniyor..."
        errorTitle="Ayarlar alınamadı"
        errorVariant="compact"
      >
        <Card title="Profil" description="Hesap ve tercih ayarlarınız">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Ad Soyad"
              value={displayName}
              onChange={(e) => {
                markDirty()
                setFullName(e.target.value)
              }}
              required
            />
            <Input
              label="E-posta"
              value={profile?.email ?? authUser?.email ?? ''}
              disabled
              hint="E-posta backend üzerinden güncellenir"
            />
            <Input
              label="Dil"
              value={displayLanguage}
              onChange={(e) => {
                markDirty()
                setLanguage(e.target.value)
              }}
            />

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={displayNotifications}
                onChange={(e) => {
                  markDirty()
                  setNotifications(e.target.checked)
                }}
                className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-foreground">Bildirimleri etkinleştir</span>
            </label>

            {updateMutation.isError && (
              <p className="text-sm text-red-600" role="alert">
                {getErrorMessage(updateMutation.error)}
              </p>
            )}

            {updateMutation.isSuccess && (
              <p className="text-sm text-primary-600">Ayarlar kaydedildi.</p>
            )}

            <Button type="submit" loading={updateMutation.isPending}>
              <Save className="h-4 w-4" />
              Kaydet
            </Button>
          </form>
        </Card>
      </QueryBoundary>
    </PageContainer>
  )
}
