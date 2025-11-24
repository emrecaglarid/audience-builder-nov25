import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/Layout/AppLayout'
import { AudiencesListPage } from './pages/AudiencesListPage'
import AudienceBuilderPage from './components/AudienceBuilder/AudienceBuilderPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to audiences */}
        <Route path="/" element={<Navigate to="/audiences" replace />} />

        {/* Audiences list page (with layout) */}
        <Route
          path="/audiences"
          element={
            <AppLayout>
              <AudiencesListPage />
            </AppLayout>
          }
        />

        {/* Audience builder pages (no layout) */}
        <Route path="/audiences/new" element={<AudienceBuilderPage />} />
        <Route path="/audiences/:id" element={<AudienceBuilderPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
