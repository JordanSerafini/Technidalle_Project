import { create } from 'zustand';
import { Client } from '@/app/utils/interfaces/client.interface';
import React from 'react';

interface ClientsState {
  clients: Client[];
  selectedClient: Client | null;
  filteredClients: Client[];
  lastFilters: {
    searchQuery?: string;
    type?: string | null;
    city?: string | null;
  };
  setClients: (clients: Client[]) => void;
  setSelectedClient: (client: Client | null) => void;
  addClient: (client: Client) => void;
  updateClient: (clientId: string | number, updatedData: Partial<Client>) => void;
  removeClient: (clientId: string | number) => void;
  filterClients: (searchQuery?: string, type?: string | null, city?: string | null) => void;
  clearFilters: () => void;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  filteredClients: [],
  selectedClient: null,
  lastFilters: {},
  setClients: (clients) => set({ 
    clients,
    filteredClients: applyFilters(clients, get().lastFilters)
  }),
  setSelectedClient: (client) => set({ selectedClient: client }),
  
  addClient: (client) => {
    const currentState = get();
    const newClients = [...currentState.clients, client];
    
    // Ne mettre à jour les clients filtrés que si le nouveau client correspond aux filtres actuels
    const shouldAddToFiltered = doesClientMatchFilters(client, currentState.lastFilters);
    const newFilteredClients = shouldAddToFiltered 
      ? [...currentState.filteredClients, client]
      : currentState.filteredClients;
      
    set({ 
      clients: newClients,
      filteredClients: newFilteredClients
    });
  },
  
  updateClient: (clientId, updatedData) => {
    const currentState = get();
    
    // Mise à jour dans la liste complète
    const updatedClients = currentState.clients.map((client) => 
      client.id === clientId ? { ...client, ...updatedData } : client
    );
    
    // Mise à jour dans la liste filtrée
    const updatedFilteredClients = currentState.filteredClients.map((client) => 
      client.id === clientId ? { ...client, ...updatedData } : client
    );
    
    set({ 
      clients: updatedClients,
      filteredClients: updatedFilteredClients
    });
  },
  
  removeClient: (clientId) => {
    const currentState = get();
    set({ 
      clients: currentState.clients.filter((client) => client.id !== clientId),
      filteredClients: currentState.filteredClients.filter((client) => client.id !== clientId)
    });
  },
  
  filterClients: (searchQuery, type, city) => {
    const currentState = get();
    const newFilters = { searchQuery, type, city };
    
    set({
      lastFilters: newFilters,
      filteredClients: applyFilters(currentState.clients, newFilters)
    });
  },
  
  clearFilters: () => {
    const currentState = get();
    set({
      lastFilters: {},
      filteredClients: [...currentState.clients]
    });
  }
}));

/**
 * Vérifie si un client correspond aux critères de filtrage
 */
function doesClientMatchFilters(
  client: Client, 
  filters: { searchQuery?: string; type?: string | null; city?: string | null }
): boolean {
  // Filtre de type
  if (filters.type) {
    if (filters.type === "Particulier") {
      if (client.company_name !== "Particulier") return false;
    } else if (filters.type === "Entreprise") {
      if (client.company_name === "Particulier" || !client.company_name) return false;
    }
  }
  
  // Filtre de ville
  if (filters.city && client.addresses?.city !== filters.city) {
    return false;
  }
  
  // Filtre de recherche textuelle
  if (filters.searchQuery && filters.searchQuery.length > 0) {
    const query = filters.searchQuery.toLowerCase();
    const matchesSearch = (
      (client.firstname && client.firstname.toLowerCase().includes(query)) ||
      (client.lastname && client.lastname.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.phone && client.phone.toLowerCase().includes(query)) ||
      (client.mobile && client.mobile.toLowerCase().includes(query)) ||
      (client.addresses?.city && client.addresses.city.toLowerCase().includes(query)) ||
      (client.notes && client.notes.toLowerCase().includes(query))
    );
    
    if (!matchesSearch) return false;
  }
  
  return true;
}

/**
 * Applique les filtres à la liste de clients
 */
function applyFilters(
  clients: Client[], 
  filters: { searchQuery?: string; type?: string | null; city?: string | null }
): Client[] {
  // Si aucun filtre, retourner tous les clients
  if (!filters.searchQuery && !filters.type && !filters.city) {
    return clients;
  }
  
  return clients.filter(client => doesClientMatchFilters(client, filters));
}

// Ajout d'un export default pour résoudre l'erreur de routing Expo
export default function ClientsStoreComponent() {
  return React.createElement(React.Fragment, null);
}
