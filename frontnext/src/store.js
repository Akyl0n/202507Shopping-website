import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(persist(
  (set) => ({
    user: null, // 用户名或用户对象
    token: null, // 可选：如有 token
    setUser: (user, token) => set({ user, token }),
    clearUser: () => set({ user: null, token: null }),
  }),
  {
    name: 'user-store', // localStorage key
    partialize: (state) => ({ user: state.user, token: state.token }),
  }
));
