import { create } from 'zustand';
import React from 'react';

interface SearchState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

// Ajout d'un export default pour résoudre l'erreur de routing Expo
export default function SearchStoreComponent() {
  return React.createElement(React.Fragment, null);
} 