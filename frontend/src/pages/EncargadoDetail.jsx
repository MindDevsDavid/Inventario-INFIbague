import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getItems } from '../services/api';
import { getEncargados } from '../services/api';

export default function EncargadoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [encargado, setEncargado] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEncargados(true),
      getItems(null, id),
    ]).then(([lista, activos]) => {
      const found = lista.find((e) => String(e.id) === String(id));
      setEncargado(found || null);
      setItems(activos);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  // Agrupar por categoría
  const byCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-5xl mx-auto">

          {/* Botón volver */}
          <button
            onClick={() => navigate('/encargados')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand transition"
          >
            ← Volver a Encargados
          </button>

          {loading ? (
            <p className="text-slate-400 text-sm">Cargando...</p>
          ) : !encargado ? (
            <p className="text-slate-400 text-sm">Encargado no encontrado.</p>
          ) : (
            <>
              {/* Tarjeta del encargado */}
              <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 border border-surface-muted p-8 mb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-brand mb-1">{encargado.nombre}</h1>
                    {encargado.cargo && <p className="text-slate-500 text-sm">{encargado.cargo}</p>}
                    {encargado.email && <p className="text-slate-400 text-sm">{encargado.email}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      encargado.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {encargado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-xs text-slate-400">{items.length} activo{items.length !== 1 ? 's' : ''} asignado{items.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Activos agrupados por categoría */}
              {items.length === 0 ? (
                <div className="bg-surface rounded-3xl border border-surface-muted p-10 text-center text-sm text-slate-400">
                  Este encargado no tiene activos asignados.
                </div>
              ) : (
                Object.entries(byCategory).map(([category, catItems]) => (
                  <div key={category} className="mb-6">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                      {category} <span className="text-slate-400 font-normal">({catItems.length})</span>
                    </h2>
                    <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-surface-muted">
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                          <thead className="bg-surface-soft">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cantidad</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ubicación</th>
                              {catItems.some((i) => i.details && Object.keys(i.details).length > 0) &&
                                Object.keys(catItems[0].details || {}).map((key) => (
                                  <th key={key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {key.replace(/_/g, ' ')}
                                  </th>
                                ))
                              }
                            </tr>
                          </thead>
                          <tbody className="bg-surface divide-y divide-surface-muted">
                            {catItems.map((item) => (
                              <tr key={item.id}>
                                <td className="px-6 py-4 text-sm font-medium text-brand">{item.id}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{item.quantity}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{item.location}</td>
                                {Object.keys(item.details || {}).map((key) => (
                                  <td key={key} className="px-6 py-4 text-sm text-slate-600">
                                    {item.details[key] || '—'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
