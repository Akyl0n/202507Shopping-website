import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 订单状态：pending=待付款，paid=已付款，cancel=已取消
export const useCheckoutOrderStore = create(persist(
  (set) => ({
    order: null,
    setOrder: (order) => set({ order }),
    clearOrder: () => set({ order: null }),
    updateStatus: (status) => set(state => state.order ? { order: { ...state.order, status } } : {}),
  }),
  {
    name: 'checkout-order-store',
    partialize: (state) => ({ order: state.order }),
  }
));
