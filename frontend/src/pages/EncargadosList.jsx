import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getUsers } from '../services/api';

export default function EncargadosList() {
  const [list, setList] = useState([]);

  const fetch = () => {
    getUsers().then((users) => {
      const usuarios = users.filter((u) => u.rol === 'usuario');
      setList(usuarios);
    }).catch(console.error);
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-brand">Encargados</h1>
          </div>

          <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-surface-muted">
            <table className="w-full table-auto">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Oficina</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-muted">
                {list.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
                {list.map((u) => (
                  <tr key={u.id} className={`transition hover:bg-slate-50 ${!u.activo ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{u.nombre || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.oficina || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
