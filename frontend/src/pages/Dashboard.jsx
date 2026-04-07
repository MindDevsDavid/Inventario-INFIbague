import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ItemModal from '../components/ItemModal';
import { getDashboard } from '../services/api';
import { CATEGORIES } from '../config/categoryFields';

const Dashboard = () => {
  const [summary, setSummary] = useState({});
  const [addCategory, setAddCategory] = useState(null);

  const fetchSummary = () => getDashboard().then(setSummary).catch(console.error);

  useEffect(() => { fetchSummary(); }, []);

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-brand mb-6">Dashboard de Inventario Tecnológico</h1>
          <div className="bg-surface p-6 rounded-3xl shadow-xl shadow-slate-200/60 border border-surface-muted">
            <h3 className="text-xl font-semibold mb-4 text-brand">Resumen de Inventario</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="bg-surface-soft p-6 rounded-3xl border border-surface-muted flex flex-col items-center gap-3">
                  <p className="text-3xl font-bold text-brand">
                    {summary[cat]?.items ?? '—'}
                  </p>
                  <p className="text-sm font-medium text-slate-700">{cat}</p>
                  <button
                    onClick={() => setAddCategory(cat)}
                    style={{ backgroundColor: '#033c63', color: '#fff' }}
                    className="w-full rounded-full py-1.5 text-xs font-medium hover:opacity-90 transition"
                  >
                    + Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 text-slate-600">Bienvenido al sistema de inventario. Gestiona todo tu equipo tecnológico desde aquí.</p>
        </div>
      </div>

      {addCategory && (
        <ItemModal
          category={addCategory}
          onClose={() => setAddCategory(null)}
          onSaved={fetchSummary}
        />
      )}
    </div>
  );
};

export default Dashboard;
