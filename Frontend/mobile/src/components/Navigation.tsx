import { useNavigationStore } from '../store/navigationStore.js';

export function Navigation() {
  const { currentPage, setCurrentPage } = useNavigationStore();

  return (
    <view className="fixed bottom-0 left-0 right-0 flex-col items-start justify-center">
      {/* Search */}
      <view className="flex flex-row justify-between items-center w-full px-4 border border-gray-700 h-10">
      <text>ddd</text>
      </view>
      {/* Navigation */}
      <view className="flex flex-row justify-between items-center w-full bg-gray-800 h-16 px-4 ">
      <text 
        className={`font-medium ${currentPage === 'dashboard' ? 'text-blue-400' : 'text-white'}`} 
        bindtap={() => setCurrentPage('dashboard')}
      >
        Dashboard
      </text>
      <text 
        className={`font-medium ${currentPage === 'planning' ? 'text-blue-400' : 'text-white'}`} 
        bindtap={() => setCurrentPage('planning')}
      >
        Planning
      </text>
      <text 
        className={`font-medium ${currentPage === 'clients' ? 'text-blue-400' : 'text-white'}`} 
        bindtap={() => setCurrentPage('clients')}
      >
        Clients
      </text>
      <text 
        className={`font-medium ${currentPage === 'projets' ? 'text-blue-400' : 'text-white'}`} 
        bindtap={() => setCurrentPage('projets')}
      >
        Projets
      </text>
      <text 
        className={`font-medium ${currentPage === 'documents' ? 'text-blue-400' : 'text-white'}`} 
        bindtap={() => setCurrentPage('documents')}
        >
          Documents
        </text>
      </view>
    </view>
  );
} 