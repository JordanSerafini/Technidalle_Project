import './App.css'
import { MemoryRouter, Routes, Route } from 'react-router'
import { Dashboard } from './pages/Dashboard.js'
import { Planning } from './pages/Planning.js'
import { Clients } from './pages/Clients.js'
import { Projets } from './pages/Projets.js'
import { Documents } from './pages/Documents.js'
import { Navigation } from './components/Navigation.js'

export function App() {
  return (
    <MemoryRouter>
      <view style={{ width: '100%', height: '100%', paddingTop: '10px' }} className="bg-gray-100">
        <view  >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/projets" element={<Projets />} />
            <Route path="/documents" element={<Documents />} />
          </Routes>
        </view>
        <Navigation />
      </view>
    </MemoryRouter>
  )
}
