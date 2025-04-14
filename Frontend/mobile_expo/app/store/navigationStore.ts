import { create } from 'zustand';
import React from 'react';

type NavigationState = {
  currentPage: string;
  setCurrentPage: (page: string) => void;
};

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
}));

// Ajout d'un export default pour résoudre l'erreur de routing Expo
export default function NavigationStoreComponent() {
  return React.createElement(React.Fragment, null);
} 