import axios from 'axios'
import { normalizeApiError } from './api-error'
import { usePermissionsStore } from '@/features/permissions/stores/permissions-store'
import { useAuthStore } from '@/stores/auth-store'

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export const api = axios.create({
  // Geliştirmede istekler Vite vekiline gider; tarayıcı 7096'ya doğrudan çıkmaz.
  // Aksi halde Authorization başlığı OPTIONS ön kontrolü tetikler ve API bağlantıyı kapatır.
  baseURL: import.meta.env.DEV ? '' : apiBase,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // FormData için boundary'li Content-Type tarayıcı/axios tarafından ayarlanmalı.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      usePermissionsStore.getState().clear()
      useAuthStore.getState().clearSession()

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    return Promise.reject(normalizeApiError(error))
  },
)
