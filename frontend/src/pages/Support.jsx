import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TicketModal from '../components/TicketModal';
import { getTickets } from '../services/api';

const ESTADO_BADGE = {
  'Abierto':    'bg-blue-100 text-blue-700',
  'En Proceso': 'bg-amber-100 text-amber-700',
  'Resuelto':   'bg-green-100 text-green-700',
  'Cerrado':    'bg-slate-100 text-slate-500',
};

const URGENCIA_BADGE = {
  'Baja':    'bg-blue-50 text-blue-600',
  'Media':   'bg-amber-50 text-amber-600',
  'Alta':    'bg-orange-100 text-orange-600',
  'Crítica': 'bg-red-100 text-red-600 font-semibold',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [search, setSearch] = useState('');
  const role = sessionStorage.getItem('role');

  const load = () => getTickets().then(setTickets).catch(console.error);
  useEffect(() => { load(); }, []);

  const filtered = tickets.filter((t) => {
    if (filterEstado && t.estado !== filterEstado) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(t.id).includes(q) ||
      t.titulo.toLowerCase().includes(q) ||
      t.tipo_incidencia.toLowerCase().includes(q) ||
      t.user_nombre.toLowerCase().includes(q) ||
      t.tecnico_nombre.toLowerCase().includes(q)
    );
  });

  const counts = {
    total:    tickets.length,
    abierto:  tickets.filter((t) => t.estado === 'Abierto').length,
    proceso:  tickets.filter((t) => t.estado === 'En Proceso').length,
    resuelto: tickets.filter((t) => t.estado === 'Resuelto').length,
  };

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">

          {/* Cabecera */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-brand">Soporte Técnico</h1>
              <p className="text-sm text-slate-400 mt-1">
                {role === 'usuario' ? 'Mis solicitudes' : 'Todas las solicitudes'}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ backgroundColor: '#033c63', color: '#fff' }}
              className="rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              + Nueva solicitud
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total', value: counts.total, color: 'text-slate-700' },
              { label: 'Abiertos', value: counts.abierto, color: 'text-blue-600' },
              { label: 'En Proceso', value: counts.proceso, color: 'text-amber-600' },
              { label: 'Resueltos', value: counts.resuelto, color: 'text-green-600' },
            ].map((s) => (
              <div key={s.label} className="bg-surface rounded-2xl border border-surface-muted p-4 text-center shadow-sm">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, tipo, usuario..."
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] transition min-w-[220px]"
            />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] transition"
            >
              <option value="">Todos los estados</option>
              <option>Abierto</option>
              <option>En Proceso</option>
              <option>Resuelto</option>
              <option>Cerrado</option>
            </select>
          </div>

          {/* Tabla */}
          <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-surface-muted">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-surface-soft">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Título</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activo</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Urgencia</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                    {role !== 'usuario' && (
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Solicitante</th>
                    )}
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Técnico</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-surface-muted">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-400">
                        {tickets.length === 0 ? 'No tienes solicitudes aún. ¡Crea la primera!' : 'No hay resultados para tu búsqueda.'}
                      </td>
                    </tr>
                  )}
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 text-sm font-mono font-medium text-slate-400">
                        #{String(t.id).padStart(4, '0')}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-800 max-w-[180px]">
                        <span className="block truncate" title={t.titulo}>{t.titulo}</span>
                        {t.descripcion && (
                          <span className="block text-xs text-slate-400 truncate" title={t.descripcion}>{t.descripcion}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">{t.tipo_incidencia}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {t.item_name ? (
                          <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-slate-600">{t.item_name}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs ${URGENCIA_BADGE[t.urgencia] || ''}`}>
                          {t.urgencia}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE[t.estado] || ''}`}>
                          {t.estado}
                        </span>
                      </td>
                      {role !== 'usuario' && (
                        <td className="px-5 py-4 text-sm text-slate-600">{t.user_nombre}</td>
                      )}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {t.tecnico_nombre || <span className="text-slate-300 text-xs">Sin asignar</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {showModal && (
        <TicketModal
          onClose={() => setShowModal(false)}
          onCreated={(ticket) => setTickets((prev) => [ticket, ...prev])}
        />
      )}
    </div>
  );
}
