import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TicketModal from '../components/TicketModal';
import { getTickets } from '../services/api';

const ESTADO_BADGE = {
  'Abierto':              'bg-blue-100 text-blue-700',
  'En Proceso':           'bg-amber-100 text-amber-700',
  'Esperando respuesta':  'bg-purple-100 text-purple-700',
  'Esperando repuesto':   'bg-indigo-100 text-indigo-700',
  'Resuelto':             'bg-green-100 text-green-700',
  'Cerrado':              'bg-slate-100 text-slate-500',
};

const URGENCIA_BADGE = {
  'Baja':    'bg-blue-50 text-blue-600',
  'Media':   'bg-amber-50 text-amber-600',
  'Alta':    'bg-orange-100 text-orange-600',
  'Crítica': 'bg-red-100 text-red-600 font-semibold',
};

const URGENCIA_ORDER = { 'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterUrgencia, setFilterUrgencia] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');

  const role = sessionStorage.getItem('role');
  const isOperator = role === 'operador' || role === 'admin';
  const navigate = useNavigate();

  const load = () => getTickets().then(setTickets).catch(console.error);
  useEffect(() => { load(); }, []);

  // Categorías únicas de los activos vinculados
  const categories = [...new Set(tickets.map((t) => t.item_category).filter(Boolean))].sort();

  const filtered = tickets
    .filter((t) => {
      if (filterEstado && t.estado !== filterEstado) return false;
      if (filterUrgencia && t.urgencia !== filterUrgencia) return false;
      if (filterCategoria && t.item_category !== filterCategoria) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        String(t.id).includes(q) ||
        t.titulo.toLowerCase().includes(q) ||
        t.tipo_incidencia.toLowerCase().includes(q) ||
        t.user_nombre.toLowerCase().includes(q) ||
        t.tecnico_nombre.toLowerCase().includes(q) ||
        (t.item_name && t.item_name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'urgency') return (URGENCIA_ORDER[a.urgencia] ?? 9) - (URGENCIA_ORDER[b.urgencia] ?? 9);
      return new Date(b.created_at) - new Date(a.created_at); // newest
    });

  const counts = {
    total:     tickets.length,
    abierto:   tickets.filter((t) => t.estado === 'Abierto').length,
    proceso:   tickets.filter((t) => t.estado === 'En Proceso').length,
    esperando: tickets.filter((t) => t.estado === 'Esperando respuesta' || t.estado === 'Esperando repuesto').length,
    resuelto:  tickets.filter((t) => t.estado === 'Resuelto').length,
  };

  const INPUT_F = 'rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#033c63] transition';

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">

          {/* Cabecera */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-brand">
                {isOperator ? 'Bandeja de Soporte' : 'Soporte Técnico'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {isOperator ? 'Gestión de solicitudes de soporte' : 'Mis solicitudes'}
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
          <div className={`grid gap-4 mb-6 ${isOperator ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {[
              { label: 'Total', value: counts.total, color: 'text-slate-700' },
              { label: 'Abiertos', value: counts.abierto, color: 'text-blue-600' },
              { label: 'En Proceso', value: counts.proceso, color: 'text-amber-600' },
              ...(isOperator ? [{ label: 'En Espera', value: counts.esperando, color: 'text-purple-600' }] : []),
              { label: 'Resueltos', value: counts.resuelto, color: 'text-green-600' },
            ].map((s) => (
              <div key={s.label} className="bg-surface rounded-2xl border border-surface-muted p-4 text-center shadow-sm">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex gap-3 mb-4 flex-wrap items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className={INPUT_F + ' min-w-[180px]'}
            />
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className={INPUT_F}>
              <option value="">Todos los estados</option>
              <option>Abierto</option>
              <option>En Proceso</option>
              {isOperator && <option>Esperando respuesta</option>}
              {isOperator && <option>Esperando repuesto</option>}
              <option>Resuelto</option>
              <option>Cerrado</option>
            </select>
            {isOperator && (
              <>
                <select value={filterUrgencia} onChange={(e) => setFilterUrgencia(e.target.value)} className={INPUT_F}>
                  <option value="">Todas las urgencias</option>
                  <option>Crítica</option>
                  <option>Alta</option>
                  <option>Media</option>
                  <option>Baja</option>
                </select>
                {categories.length > 0 && (
                  <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className={INPUT_F}>
                    <option value="">Todas las categorías</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                )}
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={INPUT_F}>
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="urgency">Mayor urgencia</option>
                </select>
              </>
            )}
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
                    {isOperator && (
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Solicitante</th>
                    )}
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Técnico</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {isOperator ? 'Antigüedad' : 'Fecha'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-surface-muted">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-400">
                        {tickets.length === 0 ? 'No hay solicitudes aún.' : 'No hay resultados para tu búsqueda.'}
                      </td>
                    </tr>
                  )}
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/soporte/${t.id}`)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="px-5 py-4 text-sm font-mono font-medium text-slate-400">
                        #{String(t.id).padStart(4, '0')}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-800 max-w-[200px]">
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
                      {isOperator && (
                        <td className="px-5 py-4 text-sm text-slate-600">{t.user_nombre}</td>
                      )}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {t.tecnico_nombre || <span className="text-slate-300 text-xs">Sin asignar</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {isOperator ? (
                          <span title={formatDate(t.created_at)}>{timeAgo(t.created_at)}</span>
                        ) : formatDate(t.created_at)}
                      </td>
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
          onCreated={() => load()}
        />
      )}
    </div>
  );
}
