import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Sidebar state management
 * Persists open/closed state to localStorage for user preference retention
 */
interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: 'sidebar-state' }
  )
);
