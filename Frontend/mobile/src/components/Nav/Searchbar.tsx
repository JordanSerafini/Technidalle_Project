import { useState, useEffect } from '@lynx-js/react';
import { useFetch } from '../../hooks/useFetch.js';

interface Client {
  id: number;
  firstname: string;
  lastname: string;
  company_name?: string;
  email: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface Material {
  id: number;
  name: string;
  description?: string;
}

interface SearchResults {
  clients: Client[];
  projects: Project[];
  materials: Material[];
}

export function Searchbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Effet pour gérer le debounce
  useEffect(() => {
    console.log("Valeur de recherche changée:", searchQuery);
    
    // Ne pas déclencher le debounce si la requête est trop courte
    if (searchQuery.trim().length < 3) {
      setIsSearching(false);
      return;
    }
    
    const timerId = setTimeout(() => {
      console.log("Debounce terminé, lancement de la recherche pour:", searchQuery);
      setDebouncedQuery(searchQuery);
      setIsSearching(true);
    }, 300); // 300ms de debounce
    
    // Nettoyer le timer si l'utilisateur continue à taper
    return () => clearTimeout(timerId);
  }, [searchQuery]);
  
  const { data, loading, error } = useFetch<SearchResults>(
    isSearching ? 'search' : '',
    { 
      searchQuery: isSearching ? debouncedQuery : '',
      limit: 20
    }
  );

  // Réinitialiser la recherche quand la requête est vide
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Ajouter des logs pour le débogage
  useEffect(() => {
    if (isSearching) {
      console.log('Recherche active avec requête debounced:', debouncedQuery);
    }
    if (data) {
      console.log('Données reçues:', data);
      console.log('Clients:', data.clients?.length || 0);
      console.log('Projets:', data.projects?.length || 0);
      console.log('Matériaux:', data.materials?.length || 0);
    }
    if (error) {
      console.error('Erreur de recherche:', error);
    }
  }, [isSearching, debouncedQuery, data, error]);

  const handleInputChange = (e: any) => {
    // Pour lynxjs, l'accès à la valeur peut être différent selon l'implémentation
    if (e.target && e.target.value !== undefined) {
      setSearchQuery(e.target.value);
    } else if (e.detail && e.detail.value !== undefined) {
      setSearchQuery(e.detail.value);
    }
    // La recherche sera déclenchée automatiquement par le debounce
  };

  // Fonction pour afficher les résultats avec un message approprié
  const hasResults = data && (
    (data.clients && data.clients.length > 0) || 
    (data.projects && data.projects.length > 0) || 
    (data.materials && data.materials.length > 0)
  );

  return (
    <view className="flex flex-row justify-between items-center px-4 border border-gray-700 h-10 rounded-md relative">
      <input 
        type="text" 
        className="flex-1 h-full bg-transparent outline-none" 
        placeholder="Rechercher..." 
        value={searchQuery}
        onInput={handleInputChange}
      />
      <text className="ml-2 text-gray-500">🔍</text>

      {/* Petit débugger */}
      <view className="absolute top-12 right-0 bg-black bg-opacity-80 p-2 rounded-md z-20 w-40">
        <text className="text-xs text-white">Query: {searchQuery}</text>
        <text className="text-xs text-white">Debounced: {debouncedQuery}</text>
        <text className="text-xs text-white">Searching: {isSearching ? 'Oui' : 'Non'}</text>
        <text className="text-xs text-white">Loading: {loading ? 'Oui' : 'Non'}</text>
        <text className="text-xs text-white">Error: {error ? 'Oui' : 'Non'}</text>
        <text className="text-xs text-white">Results: {data ? 
          `C:${data.clients?.length || 0} P:${data.projects?.length || 0} M:${data.materials?.length || 0}` 
          : 'Aucun'}</text>
      </view>

      {isSearching && (
        <view className="absolute top-12 left-0 right-0 bg-gray-800 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
          {loading && (
            <view className="p-4 flex justify-center">
              <text className="text-white">Recherche en cours...</text>
            </view>
          )}

          {!loading && error && (
            <view className="p-4">
              <text className="text-center text-red-400">Erreur de recherche</text>
            </view>
          )}

          {!loading && !error && !hasResults && (
            <view className="p-4">
              <text className="text-center text-gray-400">Aucun résultat trouvé pour "{debouncedQuery}"</text>
            </view>
          )}

          {data && data.clients && data.clients.length > 0 && (
            <view className="p-2">
              <text className="text-sm font-bold text-gray-400">Clients</text>
              {data.clients.map((client: Client) => (
                <view key={client.id} className="p-2 hover:bg-gray-700 rounded">
                  <text className="text-white">{client.firstname} {client.lastname}</text>
                  {client.company_name && <text className="text-gray-400 text-sm">{client.company_name}</text>}
                </view>
              ))}
            </view>
          )}

          {data && data.projects && data.projects.length > 0 && (
            <view className="p-2">
              <text className="text-sm font-bold text-gray-400">Projets</text>
              {data.projects.map((project: Project) => (
                <view key={project.id} className="p-2 hover:bg-gray-700 rounded">
                  <text className="text-white">{project.name}</text>
                  {project.description && <text className="text-gray-400 text-sm">{project.description.substring(0, 50)}...</text>}
                </view>
              ))}
            </view>
          )}

          {data && data.materials && data.materials.length > 0 && (
            <view className="p-2">
              <text className="text-sm font-bold text-gray-400">Matériaux</text>
              {data.materials.map((material: Material) => (
                <view key={material.id} className="p-2 hover:bg-gray-700 rounded">
                  <text className="text-white">{material.name}</text>
                  {material.description && <text className="text-gray-400 text-sm">{material.description.substring(0, 50)}...</text>}
                </view>
              ))}
            </view>
          )}
        </view>
      )}
    </view>
  );
}

export default Searchbar;