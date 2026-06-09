import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  userName: string
  email?: string
  fullName: string
  role?: string
  admin: boolean
  departmanId: number | null
  departmanAdi: string | null
}

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  setSession: (token: string, user: AuthUser) => void
  updateUser: (patch: Partial<AuthUser>) => void
  clearSession: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
      clearSession: () => set({ accessToken: null, user: null }),
      isAuthenticated: () => Boolean(get().accessToken),
    }),
    { name: 'prestij-auth' },
  ),
)
