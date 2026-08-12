import { create } from 'zustand';

interface CartDrawerState {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
}

export const useCartDrawer = create<CartDrawerState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
