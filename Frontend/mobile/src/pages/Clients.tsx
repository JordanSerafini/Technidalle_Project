import { useFetch } from '../hooks/useFetch.js';
import type { Client } from '../utils/interfaces/client.interface.js';


export function Clients() {
  const { data, loading, error } = useFetch<Client[]>('clients', {
    method: 'GET',
    limit: 5,
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
    <view style={{ width: '100%', height: '100%' }} className="flex flex-col items-center p-4">
      <text className="text-2xl font-bold mb-4">Clients</text>
      <view className="bg-white p-4 rounded shadow-md w-full">
        {data && data.length > 0 ? (
          data.map((client: Client) => (
            <view key={client.id} className="mb-2 p-2 border-b">
              <text className="font-medium">{client.lastname} {client.firstname}</text>
              <text className="text-gray-600">{client.email}</text>
            </view>
          ))
        ) : (
          <text className="text-gray-500">Aucun client trouvé</text>
        )}
      </view>
    </view>
  );
} 