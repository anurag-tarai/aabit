import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/common/MainLayout';
import { ExperienceDashboard } from './components/experience/ExperienceDashboard';
import { AuthPage } from './components/auth/AuthPage';
import { SprintDashboard } from './components/sprints/SprintDashboard';
import { SprintVisualizer } from './components/sprints/SprintVisualizer';
import { Settings } from './components/common/Setting';
import { GlobalErrorToast } from './components/common/GlobalErrorToast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const sessionToken = localStorage.getItem('aabit_session_token');
  if (!sessionToken) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <GlobalErrorToast />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ExperienceDashboard />} />
          <Route path="sprints"    element={<SprintDashboard />} />
          <Route path="visualizer" element={<SprintVisualizer />} />
          <Route path="settings"   element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
  
export default App;