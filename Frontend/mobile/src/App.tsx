import './App.css'
import { useNavigationStore } from './store/navigationStore.js'

import { Dashboard } from './pages/Dashboard.js'
import { Planning } from './pages/Planning.js'
import { Clients } from './pages/Clients.js'
import { Projets } from './pages/Projets.js'
import { Documents } from './pages/Documents.js'
import { Navigation } from './components/Navigation.js'

export function App() {
  const { currentPage } = useNavigationStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'planning':
        return <Planning />
      case 'clients':
        return <Clients />
      case 'projets':
        return <Projets />
      case 'documents':
        return <Documents />
      default:
        return <Dashboard />
    }
  }

  return (
    <view style={{ width: '100%', height: '100%', paddingTop: '10px' }} className="bg-gray-100">
      <view>
        {renderPage()}
      </view>
      <Navigation />
    </view>
  )
}
