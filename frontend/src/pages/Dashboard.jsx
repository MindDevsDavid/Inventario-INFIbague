import React from 'react';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-brand mb-6">Dashboard de Inventario Tecnológico</h1>
          <div className="bg-surface p-6 rounded-3xl shadow-xl shadow-slate-200/60 border border-surface-muted">
            <h3 className="text-xl font-semibold mb-4 text-brand">Resumen de Inventario Tecnológico</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-soft p-6 rounded-3xl border border-surface-muted text-center">
                <p className="text-3xl font-bold text-brand">12</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Programas</p>
              </div>
              <div className="bg-surface-soft p-6 rounded-3xl border border-surface-muted text-center">
                <p className="text-3xl font-bold text-brand">18</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Computadores</p>
              </div>
              <div className="bg-surface-soft p-6 rounded-3xl border border-surface-muted text-center">
                <p className="text-3xl font-bold text-brand">14</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Telefonos</p>
              </div>
              <div className="bg-surface-soft p-6 rounded-3xl border border-surface-muted text-center">
                <p className="text-3xl font-bold text-brand">7</p>
                <p className="mt-2 text-sm font-medium text-slate-700">UPSs</p>
              </div>
              <div className="bg-surface-soft p-6 rounded-3xl border border-surface-muted text-center">
                <p className="text-3xl font-bold text-brand">25</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Licencias</p>
              </div>
              <div className="bg-surface-soft p-6 rounded-3xl border border-surface-muted text-center">
                <p className="text-3xl font-bold text-brand">10</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Monitores</p>
              </div>
              <div className="bg-surface-soft p-6 rounded-3xl border border-surface-muted text-center">
                <p className="text-3xl font-bold text-brand">9</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Impresoras</p>
              </div>
            </div>
          </div>
          <p className="mt-8 text-slate-600">Bienvenido al sistema de inventario. Gestiona todo tu equipo tecnológico desde aquí.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;