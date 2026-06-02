export interface UserSettings {
  fullName: string
  email: string
  language: string
  notificationsEnabled: boolean
}

export interface UpdateSettingsRequest {
  fullName?: string
  language?: string
  notificationsEnabled?: boolean
}
