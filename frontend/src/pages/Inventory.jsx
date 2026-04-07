import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ItemModal from '../components/ItemModal';
import { getItems, deleteItem } from '../services/api';
import { CATEGORIES, CATEGORY_FIELDS } from '../config/categoryFields';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');

  const [modal, setModal] = useState(null);   // { mode: 'add'|'edit', category, item? }
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchItems = () =>
    getItems(selectedCategory).then(setItems).catch(console.error);

  useEffect(() => { fetchItems(); }, [selectedCategory]);

  const handleDelete = async () => {
    await deleteItem(confirmDelete).catch(console.error);
    setConfirmDelete(null);
    fetchItems();
  };

  // Columnas específicas a mostrar según la categoría activa
  const extraFields = selectedCategory ? (CATEGORY_FIELDS[selectedCategory] || []) : [];

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-brand">
              Inventario {selectedCategory ? `— ${selectedCategory}` : ''}
            </h1>

            {selectedCategory ? (
              // Botón específico de la categoría filtrada
              <button
                onClick={() => setModal({ mode: 'add', category: selectedCategory })}
                style={{ backgroundColor: '#033c63', color: '#fff' }}
                className="rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition"
              >
                + Agregar {selectedCategory}
              </button>
            ) : (
              // Sin filtro: selector de categoría
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Agregar:</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setModal({ mode: 'add', category: e.target.value });
                      e.target.value = '';
                    }
                  }}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63]"
                >
                  <option value="" disabled>Seleccionar categoría...</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Tabla */}
          <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-surface-muted">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-surface-soft">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                    {!selectedCategory && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</th>
                    )}
                    {extraFields.map((f) => (
                      <th key={f.key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{f.label}</th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ubicación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Encargado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-surface-muted">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={20} className="px-6 py-8 text-center text-sm text-slate-400">
                        No hay activos registrados.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand">{item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.name}</td>
                      {!selectedCategory && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.category}</td>
                      )}
                      {extraFields.map((f) => (
                        <td key={f.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {item.details?.[f.key] || '—'}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.encargado || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal({ mode: 'edit', category: item.category, item })}
                            className="rounded-full border px-3 py-1 text-xs font-medium transition hover:text-white"
                            style={{ borderColor: '#033c63', color: '#033c63' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#033c63'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#033c63'; }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(item.id)}
                            className="rounded-full border border-red-400 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-500 hover:text-white transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal agregar / editar */}
      {modal && (
        <ItemModal
          category={modal.category}
          item={modal.item || null}
          onClose={() => setModal(null)}
          onSaved={fetchItems}
        />
      )}

      {/* Confirmar eliminación */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <h2 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar activo?</h2>
            <p className="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 rounded-full bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
              >
                Eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
