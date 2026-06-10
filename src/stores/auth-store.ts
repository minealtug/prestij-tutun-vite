import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  isTokenExpired,
  resolveTokenExpiryMs,
} from '@/features/auth/utils/token-expiry'

export interface AuthUser {
  id: string
  userName: string
  email?: string
  fullName: string
  role?: string
  admin: boolean
  departmanId: number | null
  departmanAdi: string | null
  mintikaId: number | null
}

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  expiresAt: number | null
  setSession: (token: string, user: AuthUser, expiresAt?: number | null) => void
  updateUser: (patch: Partial<AuthUser>) => void
  clearSession: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      expiresAt: null,
      setSession: (accessToken, user, expiresAt = null) => {
        const resolvedExpiry = resolveTokenExpiryMs(accessToken, expiresAt)
        set({ accessToken, user, expiresAt: resolvedExpiry })
      },
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
      clearSession: () => set({ accessToken: null, user: null, expiresAt: null }),
      isAuthenticated: () => {
        const { accessToken, expiresAt } = get()
        return !isTokenExpired(accessToken, expiresAt)
      },
    }),
    {
      name: 'prestij-auth',
      onRehydrateStorage: () => (state) => {
        if (state && !state.isAuthenticated()) {
          state.clearSession()
        }
      },
    },
  ),
)
