import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { IdePage } from './pages/IdePage';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { PublicViewerPage } from './pages/PublicViewerPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdePage />} />
            <Route path="/project/:id" element={<IdePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/p/:slug" element={<PublicViewerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
