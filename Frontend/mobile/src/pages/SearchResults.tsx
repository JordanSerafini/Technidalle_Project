import { useNavigationStore } from '../store/navigationStore.js';
import { useSearchStore } from '../store/searchStore.js';
import { useFetch } from '../hooks/useFetch.js';
import type { Client, Address } from '../utils/interfaces/client.interface.js';
import type { Project, Stage } from '../utils/interfaces/project.interface.js';
import type { Material } from '../utils/interfaces/material.interface.js';

// Créer une interface étendue pour ajouter les propriétés spécifiques à l'API
interface ApiProject extends Project {
  reference?: string;
  status?: string;
  budget?: string;
}

// Interface pour la réponse API qui utilise les interfaces existantes
interface SearchResponse {
  clients: Client[];
  projects: ApiProject[];
  materials: Material[];
}

// Fonction pour formater les statuts des projets
const formatProjectStatus = (status: string): { text: string; color: string } => {
  switch (status) {
    case 'en_cours':
      return { text: 'En cours', color: 'bg-blue-900 text-blue-300' };
    case 'termine':
      return { text: 'Terminé', color: 'bg-green-900 text-green-300' };
    case 'en_preparation':
      return { text: 'En préparation', color: 'bg-yellow-900 text-yellow-300' };
    case 'devis_accepte':
      return { text: 'Devis accepté', color: 'bg-purple-900 text-purple-300' };
    default:
      return { text: status, color: 'bg-gray-900 text-gray-300' };
  }
};

// Fonction pour formater les dates
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('fr-FR');
};

export function SearchResults() {
  const { setCurrentPage } = useNavigationStore();
  const { searchQuery } = useSearchStore();
  
  // Utilisation du hook useFetch pour récupérer les résultats de recherche
  const { data, loading, error } = useFetch<SearchResponse>('search', {
    searchQuery: searchQuery,
    limit: 20
  });
  
  // Fonction pour revenir à la page précédente
  const goBack = () => {
    setCurrentPage('dashboard');
  };

  // Fonction pour naviguer vers la page d'un client
  const viewClient = (clientId: number) => {
    // TODO: implémenter la navigation vers le détail du client
    console.log("Voir client:", clientId);
  };

  // Fonction pour naviguer vers la page d'un projet
  const viewProject = (projectId: number) => {
    // TODO: implémenter la navigation vers le détail du projet
    console.log("Voir projet:", projectId);
  };

  // Fonction pour naviguer vers la page d'un matériel
  const viewMaterial = (materialId: number) => {
    // TODO: implémenter la navigation vers le détail du matériel
    console.log("Voir matériel:", materialId);
  };

  // Fonction pour calculer le nombre total de résultats
  const getTotalResults = () => {
    if (!data) return 0;
    return (data.clients?.length || 0) + (data.projects?.length || 0) + (data.materials?.length || 0);
  };

  return (
    <view className="flex flex-col w-full h-full bg-gray-900">
      {/* Header avec titre et bouton retour */}
      <view className="flex flex-row items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <view className="flex flex-row items-center">
          <text className="text-blue-400 text-lg mr-2" bindtap={goBack}>←</text>
          <text className="text-white font-bold text-lg">Résultats</text>
        </view>
        <text className="text-gray-400">"{searchQuery || ''}"</text>
      </view>
      
      {/* Contenu des résultats */}
      <view className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <text className="text-white">Chargement en cours...</text>
        ) : error ? (
          <view className="p-4 bg-red-900 bg-opacity-30 rounded-md">
            <text className="text-red-300">Erreur: {error}</text>
          </view>
        ) : !data || getTotalResults() === 0 ? (
          <view className="p-4 bg-gray-800 rounded-md">
            <text className="text-gray-300">
              Aucun résultat trouvé pour "{searchQuery}".
            </text>
          </view>
        ) : (
          <view className="space-y-4">
            <text className="text-white">
              {getTotalResults()} résultat(s) pour: {searchQuery}
            </text>
            
            {/* Résultats des clients */}
            {data.clients && data.clients.length > 0 && (
              <view className="space-y-2">
                <text className="text-white font-bold text-lg">Clients ({data.clients.length})</text>
                {data.clients.map((client) => (
                  <view key={client.id} className="p-3 bg-gray-800 rounded-md" bindtap={() => client.id && viewClient(client.id)}>
                    <text className="text-white font-bold">
                      {client.firstname} {client.lastname}
                      {client.company_name !== 'Particulier' && ` - ${client.company_name}`}
                    </text>
                    <text className="text-gray-300 mt-1">{client.email}</text>
                    <view className="flex flex-row justify-between mt-1">
                      <text className="text-gray-400 text-sm">{client.phone}</text>
                      {client.mobile && (
                        <text className="text-gray-400 text-sm">{client.mobile}</text>
                      )}
                    </view>
                    {client.addresses && (
                      <text className="text-gray-400 text-xs mt-1">
                        {client.addresses.street_number} {client.addresses.street_name}, {client.addresses.zip_code} {client.addresses.city}
                      </text>
                    )}
                  </view>
                ))}
              </view>
            )}
            
            {/* Résultats des projets */}
            {data.projects && data.projects.length > 0 && (
              <view className="space-y-2">
                <text className="text-white font-bold text-lg">Projets ({data.projects.length})</text>
                {data.projects.map((project) => {
                  // Adapte pour la structure API qui peut utiliser status au lieu de notre modèle interne
                  const status = formatProjectStatus(project.status || '');
                  return (
                    <view key={project.id} className="p-3 bg-gray-800 rounded-md" bindtap={() => viewProject(project.id)}>
                      <view className="flex flex-row justify-between">
                        <text className="text-white font-bold">{project.name}</text>
                        <text className="text-gray-400 text-xs">{project.reference || ''}</text>
                      </view>
                      <text className="text-gray-300 mt-1 text-sm">{project.description}</text>
                      <view className="flex flex-row justify-between mt-2">
                        <view className={`px-2 py-1 ${status.color} rounded-md`}>
                          <text className="text-xs">{status.text}</text>
                        </view>
                        <text className="text-gray-400 text-xs">
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </text>
                      </view>
                      {project.budget && (
                        <text className="text-green-400 text-sm mt-1">Budget: {parseInt(project.budget).toLocaleString('fr-FR')}€</text>
                      )}
                    </view>
                  );
                })}
              </view>
            )}
            
            {/* Résultats des matériaux */}
            {data.materials && data.materials.length > 0 && (
              <view className="space-y-2">
                <text className="text-white font-bold text-lg">Matériaux ({data.materials.length})</text>
                {data.materials.map((material) => {
                  // Adapter Material pour accéder à quantity qui pourrait être stock_quantity
                  const apiMaterial = material as Material & { quantity?: number };
                  return (
                    <view key={material.id} className="p-3 bg-gray-800 rounded-md" bindtap={() => viewMaterial(material.id)}>
                      <text className="text-white font-bold">{material.name}</text>
                      <text className="text-gray-300 mt-1">{material.description}</text>
                      <view className="flex flex-row justify-between mt-2">
                        <text className="text-gray-400 text-sm">Quantité: {apiMaterial.quantity || material.stock_quantity || 0}</text>
                        {material.price !== undefined && (
                          <text className="text-green-400 text-sm">{material.price.toLocaleString('fr-FR')}€</text>
                        )}
                      </view>
                    </view>
                  );
                })}
              </view>
            )}
          </view>
        )}
        
        <view className="mt-4">
          <text 
            className="text-blue-400 p-2 bg-blue-900 bg-opacity-30 rounded-md"
            bindtap={goBack}
          >
            Retour au dashboard
          </text>
        </view>
      </view>
    </view>
  );
}

export default SearchResults; 