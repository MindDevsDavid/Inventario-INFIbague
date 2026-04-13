import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getUsers, createUser, updateUser, toggleUser } from '../services/api';

const EMPTY = { username: '', password: '', rol: 'usuario', nombre: '', cargo: '', email: '' };
const INPUT = 'w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] transition';

const ROL_BADGE = {
  admin:    'bg-purple-100 text-purple-700',
  tecnico:  'bg-amber-100 text-amber-700',
  usuario:  'bg-blue-100 text-blue-700',
};

export default function Users() {
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const currentUser = sessionStorage.getItem('username') || '';

  const fetch = () => getUsers().then(setList).catch(console.error);
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit = (u) => {
    setForm({ username: u.username, password: '', rol: u.rol, nombre: u.nombre || '', cargo: u.cargo || '', email: u.email || '' });
    setEditId(u.id);
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
      if (modal === 'add') await createUser(form);
      else await updateUser(editId, form);
      close();
      fetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    await toggleUser(id).catch((err) =>
      alert(err.response?.data?.error || 'No se pudo cambiar el estado')
    );
    fetch();
  };

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-brand">Usuarios del sistema</h1>
            <button
              onClick={openAdd}
              style={{ backgroundColor: '#033c63', color: '#fff' }}
              className="rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              + Nuevo usuario
            </button>
          </div>

          <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-surface-muted">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-surface-soft">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Oficina</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-surface-muted">
                  {list.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">No hay usuarios.</td></tr>
                  )}
                  {list.map((u) => (
                    <tr key={u.id} className={!u.activo ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {u.nombre || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {u.username}
                        {u.username === currentUser && (
                          <span className="ml-2 text-xs text-slate-400">(tú)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.cargo || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${ROL_BADGE[u.rol] || ''}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded-full border px-3 py-1 text-xs font-medium transition"
                            style={{ borderColor: '#033c63', color: '#033c63' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#033c63'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#033c63'; }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggle(u.id)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              u.activo
                                ? 'border-amber-400 text-amber-600 hover:bg-amber-500 hover:text-white'
                                : 'border-green-400 text-green-600 hover:bg-green-500 hover:text-white'
                            }`}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-xl font-bold mb-1" style={{ color: '#033c63' }}>
              {modal === 'add' ? 'Nuevo usuario' : 'Editar usuario'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Datos personales */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
                  className={INPUT} placeholder="Ej: Carlos Ramírez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Oficina <span className="text-slate-400 text-xs">(opcional)</span>
                </label>
                <select value={form.cargo} onChange={(e) => set('cargo', e.target.value)} className={INPUT}>
                  <option value="">— Sin asignar —</option>
                  <option>Gerencia</option>
                  <option>Contabilidad</option>
                  <option>Sistemas</option>
                  <option>Recursos Humanos</option>
                  <option>Soporte Técnico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-slate-400 text-xs">(opcional)</span>
                </label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  className={INPUT} placeholder="Ej: correo@empresa.com" />
              </div>

              {/* Separador */}
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Credenciales de acceso</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre de usuario <span className="text-red-500">*</span>
                  </label>
                  <input required value={form.username} onChange={(e) => set('username', e.target.value)}
                    className={INPUT} placeholder="Ej: carlos.ramirez" autoComplete="off" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {modal === 'add' ? <>Contraseña <span className="text-red-500">*</span></> : 'Nueva contraseña (dejar vacío para no cambiar)'}
                  </label>
                  <input type="password" value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    className={INPUT} placeholder="Mínimo 6 caracteres"
                    required={modal === 'add'} autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                  <select value={form.rol} onChange={(e) => set('rol', e.target.value)} className={INPUT}>
                    <option value="usuario">Usuario</option>
                    <option value="tecnico">Técnico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
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
