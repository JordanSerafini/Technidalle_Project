import { useNavigationStore } from '../store/navigationStore.js';

export function Navigation() {
  const { currentPage, setCurrentPage } = useNavigationStore();

  return (
    <view className="fixed bottom-0 left-0 right-0 bg-gray-800 flex justify-between items-center p-4">
      <text 
        className={`text-white font-medium ${currentPage === 'dashboard' ? 'text-blue-400' : ''}`} 
        bindtap={() => setCurrentPage('dashboard')}
      >
        Dashboard
      </text>
      <text 
        className={`text-white font-medium ${currentPage === 'planning' ? 'text-blue-400' : ''}`} 
        bindtap={() => setCurrentPage('planning')}
      >
        Planning
      </text>
      <text 
        className={`text-white font-medium ${currentPage === 'clients' ? 'text-blue-400' : ''}`} 
        bindtap={() => setCurrentPage('clients')}
      >
        Clients
      </text>
      <text 
        className={`text-white font-medium ${currentPage === 'projets' ? 'text-blue-400' : ''}`} 
        bindtap={() => setCurrentPage('projets')}
      >
        Projets
      </text>
      <text 
        className={`text-white font-medium ${currentPage === 'documents' ? 'text-blue-400' : ''}`} 
        bindtap={() => setCurrentPage('documents')}
      >
        Documents
      </text>
    </view>
  );
} 