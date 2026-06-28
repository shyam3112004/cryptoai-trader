import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      loginAttempts: 0,
      lockedUntil: null,

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('http://localhost:8000/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: data.full_name,
              email: data.email,
              password: data.password,
              whatsapp_number: data.whatsapp_number || null
            })
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.detail || 'Registration failed')
          
          set({
            user: {
              id: json.user.id,
              name: json.user.name,
              email: json.user.email,
              mode: json.user.mode,
              whatsapp: json.user.whatsapp_number || '',
              callmebot_apikey: json.user.callmebot_apikey || '',
              telegram_bot_token: json.user.telegram_bot_token || '',
              telegram_chat_id: json.user.telegram_chat_id || ''
            },
            token: json.access_token,
            isLoading: false,
            loginAttempts: 0,
            lockedUntil: null
          })
          return true
        } catch (err) {
          set({ error: err.message, isLoading: false })
          return false
        }
      },

      login: async (data) => {
        set({ isLoading: true, error: null })
        try {
          // Check local lockout timer first
          const now = Date.now()
          const lockedUntil = get().lockedUntil
          if (lockedUntil && now < lockedUntil) {
            const minutesLeft = Math.ceil((lockedUntil - now) / 60000)
            throw new Error(`Account locked. Retry in ${minutesLeft} minute(s).`)
          }

          const res = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.email,
              password: data.password,
              remember_me: data.remember_me || false
            })
          })
          const json = await res.json()
          
          if (!res.ok) {
            // Check if server locked the account
            if (res.status === 423) {
              const lockDuration = 5 * 60 * 1000 // 5 minutes
              set({
                loginAttempts: 3,
                lockedUntil: Date.now() + lockDuration,
                isLoading: false
              })
            }
            throw new Error(json.detail || 'Login failed')
          }

          set({
            user: {
              id: json.user.id,
              name: json.user.name,
              email: json.user.email,
              mode: json.user.mode,
              whatsapp: json.user.whatsapp_number || '',
              callmebot_apikey: json.user.callmebot_apikey || '',
              telegram_bot_token: json.user.telegram_bot_token || '',
              telegram_chat_id: json.user.telegram_chat_id || ''
            },
            token: json.access_token,
            isLoading: false,
            loginAttempts: 0,
            lockedUntil: null
          })
          return true
        } catch (err) {
          set({ error: err.message, isLoading: false })
          return false
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
      },

      setMode: (mode) => {
        const user = get().user
        if (user) {
          set({ user: { ...user, mode } })
        }
      },

      updateUser: (fields) => {
        const user = get().user
        if (user) {
          set({ user: { ...user, ...fields } })
        }
      },

      clearError: () => set({ error: null }),
      resetLockout: () => set({ loginAttempts: 0, lockedUntil: null })
    }),
    {
      name: 'cryptoai-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        lockedUntil: state.lockedUntil,
        loginAttempts: state.loginAttempts
      })
    }
  )
)
