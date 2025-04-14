import { create } from 'zustand';
import React from 'react';
import { Project, project_status } from '../utils/interfaces/project.interface';

interface ProjectFilters {
  searchQuery: string;
  selectedStatuses: project_status[];
  startDate: Date | null;
  endDate: Date | null;
}

type ApplyFilterListener = () => void;

interface ProjectState {
  // Données des projets
  projects: Project[];
  filteredProjects: Project[];
  selectedProject: Project | null;
  
  // États des filtres
  filters: ProjectFilters;
  
  // Écouteurs d'événements
  applyListeners: ApplyFilterListener[];
  
  // Actions pour les projets
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  
  // Actions pour les filtres
  setSearchQuery: (query: string) => void;
  setSelectedStatuses: (statuses: project_status[]) => void;
  toggleStatus: (status: project_status) => void;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  
  // Gestion des événements
  addApplyListener: (listener: ApplyFilterListener) => void;
  removeApplyListener: (listener: ApplyFilterListener) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // État initial
  projects: [],
  filteredProjects: [],
  selectedProject: null,
  
  filters: {
    searchQuery: '',
    selectedStatuses: [],
    startDate: null,
    endDate: null,
  },
  
  // Écouteurs d'événements
  applyListeners: [],
  
  // Actions pour les projets
  setProjects: (projects) => {
    set({ 
      projects,
      filteredProjects: projects 
    });
  },
  
  setSelectedProject: (project) => set({ selectedProject: project }),
  
  // Actions pour les filtres
  setSearchQuery: (searchQuery) => set((state) => ({
    filters: { ...state.filters, searchQuery }
  })),
  
  setSelectedStatuses: (selectedStatuses) => set((state) => ({
    filters: { ...state.filters, selectedStatuses }
  })),
  
  toggleStatus: (status) => set((state) => {
    const selectedStatuses = state.filters.selectedStatuses.includes(status)
      ? state.filters.selectedStatuses.filter(s => s !== status)
      : [...state.filters.selectedStatuses, status];
      
    return {
      filters: { ...state.filters, selectedStatuses }
    };
  }),
  
  setStartDate: (startDate) => set((state) => ({
    filters: { ...state.filters, startDate }
  })),
  
  setEndDate: (endDate) => set((state) => ({
    filters: { ...state.filters, endDate }
  })),
  
  resetFilters: () => set((state) => ({
    filters: {
      searchQuery: '',
      selectedStatuses: [],
      startDate: null,
      endDate: null,
    },
    filteredProjects: state.projects
  })),
  
  applyFilters: () => {
    const state = get();
    const { searchQuery, selectedStatuses, startDate, endDate } = state.filters;
    
    let filtered = [...state.projects];
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        (project.name && project.name.toLowerCase().includes(query)) ||
        (project.reference && project.reference.toLowerCase().includes(query)) ||
        (project.description && project.description.toLowerCase().includes(query))
      );
    }
    
    // Filtre par statuts
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(project => 
        project.status && selectedStatuses.includes(project.status)
      );
    }
    
    // Filtre par date de début
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(project => 
        project.start_date && new Date(project.start_date) >= start
      );
    }
    
    // Filtre par date de fin
    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter(project => 
        project.end_date && new Date(project.end_date) <= end
      );
    }
    
    set({ filteredProjects: filtered });
    
    // Notification de tous les écouteurs
    state.applyListeners.forEach(listener => listener());
  },
  
  // Gestion des événements
  addApplyListener: (listener) => set((state) => ({
    applyListeners: [...state.applyListeners, listener]
  })),
  
  removeApplyListener: (listener) => set((state) => ({
    applyListeners: state.applyListeners.filter(l => l !== listener)
  })),
}));

// Export default pour résoudre l'erreur de routing Expo
export default function ProjectStoreComponent() {
  return React.createElement(React.Fragment, null);
} 