import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        const { token } = res.data;
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
        return token;
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
);
