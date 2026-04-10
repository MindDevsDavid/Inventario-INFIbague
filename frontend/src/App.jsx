import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Encargados from './pages/Encargados';
import EncargadoDetail from './pages/EncargadoDetail';
import Users from './pages/Users';
import Support from './pages/Support';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/encargados" element={<ProtectedRoute><Encargados /></ProtectedRoute>} />
        <Route path="/encargados/:id" element={<ProtectedRoute><EncargadoDetail /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/soporte" element={<ProtectedRoute><Support /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
