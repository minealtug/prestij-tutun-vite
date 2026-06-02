import { apiClient } from '@/lib/api/api-client'
import type { UpdateSettingsRequest, UserSettings } from '../types/settings.types'

export const settingsApi = {
  getProfile: () => apiClient.get<UserSettings>('/settings/profile'),

  updateProfile: (payload: UpdateSettingsRequest) =>
    apiClient.put<UserSettings>('/settings/profile', payload),
}
