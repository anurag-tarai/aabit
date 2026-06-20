import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/common/MainLayout';
import { ExperienceDashboard } from './components/experience/ExperienceDashboard';
import { AuthPage } from './components/auth/AuthPage';
import { SprintDashboard } from './components/sprints/SprintDashboard';

// Complete Stateless Route Boundary Protection Guard 
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const sessionToken = localStorage.getItem('aabit_session_token');
  
  if (!sessionToken) {
    // If token configuration is missing, redirect securely straight into the login card gate 
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Node Route Context */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Personal Ecosystem Operating Modules Layout Space */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Baseline index targets your unified Experience Timeline Logger directly */}
          <Route index element={<ExperienceDashboard />} />
          
          {/* Future Plug-and-Play slots mount modularly right under this exact wrapper layout: */}
          {/* <Route path="habits" element={<HabitDashboard />} /> */}
          {/* <Route path="sprints" element={<SprintDashboard />} /> */}
          <Route path="habits" element={<div className="font-mono text-xs text-neutral-500 p-4 border border-dashed border-neutral-800 rounded">SYSTEM_NODE: HABIT_LOG_ENGINE // COMING_SOON</div>} />
          <Route path="sprints" element={<SprintDashboard />} />
        </Route>

        {/* Catch-All Standard Fallback Safety Re-router */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
        
  
      </Routes>
    </BrowserRouter>
  );
}

export default App;