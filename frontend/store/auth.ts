import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setToken } from '@/lib/api'

interface User {
  id: string
  email: string
  username: string | null
  telegram_id: number | null
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username?: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await api.post('/auth/login', { email, password })
          const token = res.data.access_token
          setToken(token)
          set({ token })
          await get().fetchMe()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email, password, username) => {
        set({ isLoading: true })
        try {
          await api.post('/auth/register', { email, password, username })
          await get().login(email, password)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        await api.post('/auth/logout')
        setToken(null)
        set({ user: null, token: null })
      },

      fetchMe: async () => {
        const res = await api.get('/users/me')
        set({ user: res.data })
      },
    }),
    {
      name: 'auth',
      // _hasHydrated — runtime-флаг, не нужно персистить
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setToken(state.token)
        // Сигнализируем что гидрация завершена
        useAuth.getState().setHasHydrated(true)
      },
    }
  )
)
