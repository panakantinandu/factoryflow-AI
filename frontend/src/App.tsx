import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { DiagnosePage } from './pages/DiagnosePage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { KnowledgePage } from './pages/KnowledgePage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-factory-bg text-gray-100 font-mono">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl">
          <Routes>
            <Route path="/" element={<DiagnosePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
