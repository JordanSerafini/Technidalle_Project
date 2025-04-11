import { useFetch } from '../hooks/useFetch.js';
import type { Project } from '../utils/interfaces/project.interface.js';

export function Projets() {
  const { data, loading, error } = useFetch<Project[]>('projects', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    }
  });

  if (loading) {
    return (
      <view className="flex items-center justify-center h-full">
        <text className="text-gray-600">Chargement...</text>
      </view>
    );
  }

  if (error) {
    return (
      <view className="flex items-center justify-center h-full">
        <text className="text-red-500">Erreur: {error}</text>
      </view>
    );
  }

  return (
    <view style={{ height: '100vh' }} className="flex flex-col">
      <view className="p-4">
        <text className="text-2xl font-bold">Projets</text>
      </view>
      <scroll-view 
        style={{ flex: 1 }}
        scroll-y
        className="px-4"
      >
        {data && data.length > 0 ? (
          data.map((projet: Project) => (
            <view 
              key={projet.id} 
              className="bg-white p-4 rounded shadow-md mb-4"
            >
              <text className="font-medium block">{projet.name}</text>
              <text className="text-gray-600 block mt-1">{projet.description}</text>
              <text className="text-gray-600 block mt-1">{projet.startDate}</text>
              <text className="text-gray-600 block mt-1">{projet.endDate}</text>
            </view>
          ))
        ) : (
          <text className="text-gray-500">Aucun client trouvé</text>
        )}
      </scroll-view>
    </view>
  );
} 