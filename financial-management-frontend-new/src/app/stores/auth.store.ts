import { create } from 'zustand'
import { User } from '../types'

export interface AuthStore {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  token: localStorage.getItem('token'),
  
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
  }),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  logout: () => set({
    user: null,
    token: null,
    isAuthenticated: false,
  }),
}))
