import { useNavigate } from 'react-router';

export function Navigation() {
  const navigate = useNavigate();

  return (
    <view className="fixed bottom-0 left-0 right-0 bg-gray-800 flex justify-between items-center p-4">
      <text 
        className="text-white font-medium" 
        bindtap={() => navigate('/dashboard')}
      >
        Dashboard
      </text>
      <text 
        className="text-white font-medium" 
        bindtap={() => navigate('/planning')}
      >
        Planning
      </text>
      <text 
        className="text-white font-medium" 
        bindtap={() => navigate('/clients')}
      >
        Clients
      </text>
      <text 
        className="text-white font-medium" 
        bindtap={() => navigate('/projets')}
      >
        Projets
      </text>
      <text 
        className="text-white font-medium" 
        bindtap={() => navigate('/documents')}
      >
        Documents
      </text>
    </view>
  );
} 