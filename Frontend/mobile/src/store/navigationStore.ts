import { create } from 'zustand';

type NavigationState = {
  currentPage: string;
  setCurrentPage: (page: string) => void;
};

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
})); 