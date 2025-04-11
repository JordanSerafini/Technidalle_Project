import { useState } from '@lynx-js/react';
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
  const [isSearching, setIsSearching] = useState(false);
  const { data, loading, error } = useFetch<SearchResults>(
    isSearching ? 'search' : '',
    { 
      searchQuery: isSearching ? searchQuery : '',
      limit: 20
    }
  );

  const handleInputChange = (e: any) => {
    // Pour lynxjs, l'accès à la valeur peut être différent selon l'implémentation
    if (e.target && e.target.value !== undefined) {
      setSearchQuery(e.target.value);
    } else if (e.detail && e.detail.value !== undefined) {
      setSearchQuery(e.detail.value);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim().length > 2) {
      setIsSearching(true);
    }
  };

  return (
    <view className="flex flex-row justify-between items-center px-4 border border-gray-700 h-10 rounded-md">
      <input 
        type="text" 
        className="flex-1 h-full bg-transparent outline-none" 
        placeholder="Rechercher..." 
        value={searchQuery}
        onInput={handleInputChange}
        onKeyUp={(e: any) => e.key === 'Enter' && handleSearch()}
      />
      <button onClick={handleSearch} className="ml-2">
        <text className="text-gray-500">🔍</text>
      </button>

      {isSearching && data && (
        <view className="absolute top-12 left-0 right-0 bg-gray-800 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
          {data.clients && data.clients.length > 0 && (
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

          {data.projects && data.projects.length > 0 && (
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

          {data.materials && data.materials.length > 0 && (
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

          {(!data.clients?.length && !data.projects?.length && !data.materials?.length) && (
            <view className="p-4">
              <text className="text-center text-gray-400">Aucun résultat trouvé</text>
            </view>
          )}
        </view>
      )}
    </view>
  );
}

export default Searchbar;