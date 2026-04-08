import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getEncargados, createEncargado, updateEncargado, toggleEncargado } from '../services/api';

const EMPTY = { nombre: '', cargo: '', email: '' };
const INPUT = 'w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] transition';

export default function Encargados() {
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const role = sessionStorage.getItem('role');
  const canAdd  = role === 'admin';
  const canEdit = role === 'admin' || role === 'operador';
  const navigate = useNavigate();

  const fetch = () => getEncargados(true).then(setList).catch(console.error);
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit = (e) => {
    setForm({ nombre: e.nombre, cargo: e.cargo, email: e.email });
    setEditId(e.id);
    setError('');
    setModal('edit');
  };
  const close = () => { setModal(null); setEditId(null); };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (modal === 'add') await createEncargado(form);
      else await updateEncargado(editId, form);
      close();
      fetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    await toggleEncargado(id).catch(console.error);
    fetch();
  };

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-brand">Encargados</h1>
            {canAdd && (
              <button
                onClick={openAdd}
                style={{ backgroundColor: '#033c63', color: '#fff' }}
                className="rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition"
              >
                + Nuevo encargado
              </button>
            )}
          </div>

          <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-surface-muted">
            <table className="w-full table-auto">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cargo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  {canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-muted">
                {list.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                      No hay encargados registrados.
                    </td>
                  </tr>
                )}
                {list.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/encargados/${e.id}`)}
                    className={`cursor-pointer transition hover:bg-slate-50 ${!e.activo ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{e.nombre}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{e.cargo || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{e.email || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        e.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {e.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(e)}
                            className="rounded-full border px-3 py-1 text-xs font-medium transition"
                            style={{ borderColor: '#033c63', color: '#033c63' }}
                            onMouseEnter={(el) => { el.currentTarget.style.backgroundColor = '#033c63'; el.currentTarget.style.color = '#033c63'; }}
                            onMouseLeave={(el) => { el.currentTarget.style.backgroundColor = ''; el.currentTarget.style.color = '#033c63'; }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggle(e.id)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              e.activo
                                ? 'border-amber-400 text-amber-600 hover:bg-amber-500 hover:text-white'
                                : 'border-green-400 text-green-600 hover:bg-green-500 hover:text-white'
                            }`}
                          >
                            {e.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#033c63' }}>
              {modal === 'add' ? 'Nuevo encargado' : 'Editar encargado'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
                  className={INPUT} placeholder="Ej: Carlos Ramírez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <input value={form.cargo} onChange={(e) => set('cargo', e.target.value)}
                  className={INPUT} placeholder="Ej: Administrador TI" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  className={INPUT} placeholder="Ej: correo@empresa.com" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={saving}
                  style={{ backgroundColor: '#033c63', color: '#fff' }}
                  className="flex-1 rounded-full py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">
                  {saving ? 'Guardando...' : modal === 'add' ? 'Crear' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={close}
                  className="flex-1 rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
