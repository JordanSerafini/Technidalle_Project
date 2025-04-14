import { create } from 'zustand';
import React from 'react';

interface ClientsState {
  clients: any[];
  selectedClient: any | null;
  setClients: (clients: any[]) => void;
  setSelectedClient: (client: any | null) => void;
  addClient: (client: any) => void;
  updateClient: (clientId: string, updatedData: any) => void;
  removeClient: (clientId: string) => void;
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  selectedClient: null,
  setClients: (clients) => set({ clients }),
  setSelectedClient: (client) => set({ selectedClient: client }),
  addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (clientId, updatedData) => set((state) => ({
    clients: state.clients.map((client) => 
      client.id === clientId ? { ...client, ...updatedData } : client
    )
  })),
  removeClient: (clientId) => set((state) => ({
    clients: state.clients.filter((client) => client.id !== clientId)
  })),
}));

// Ajout d'un export default pour résoudre l'erreur de routing Expo
export default function ClientsStoreComponent() {
  return React.createElement(React.Fragment, null);
}
