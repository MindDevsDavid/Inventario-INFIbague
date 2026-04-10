import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getTicket, getTicketHistory, updateTicket, addTicketNote, getTecnicos } from '../services/api';

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
  'Crítica': 'bg-red-100 text-red-600',
};

const HISTORY_ICON = {
  creacion:         { icon: '+',  color: 'bg-green-500' },
  cambio_estado:    { icon: '→',  color: 'bg-amber-500' },
  cambio_urgencia:  { icon: '!',  color: 'bg-orange-500' },
  asignacion:       { icon: '👤', color: 'bg-blue-500' },
  comunicacion:     { icon: '💬', color: 'bg-cyan-500' },
  nota_privada:     { icon: '🔒', color: 'bg-slate-500' },
};

const ESTADOS = ['Abierto', 'En Proceso', 'Esperando respuesta', 'Esperando repuesto', 'Resuelto', 'Cerrado'];
const URGENCIAS = ['Baja', 'Media', 'Alta', 'Crítica'];

const INPUT = 'w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] transition';

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = sessionStorage.getItem('role');
  const isOperator = role === 'operador' || role === 'admin';
  const isAdmin = role === 'admin';

  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Acciones del operador
  const [editEstado, setEditEstado] = useState('');
  const [editUrgencia, setEditUrgencia] = useState('');
  const [editTecnico, setEditTecnico] = useState('');
  const [saving, setSaving] = useState(false);

  // Notas
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('comunicacion');
  const [sendingNote, setSendingNote] = useState(false);

  const load = () => {
    Promise.all([
      getTicket(id),
      getTicketHistory(id),
      ...(isAdmin ? [getTecnicos()] : []),
    ]).then(([t, h, tecs]) => {
      setTicket(t);
      setHistory(h);
      setEditEstado(t.estado);
      setEditUrgencia(t.urgencia);
      setEditTecnico(t.tecnico_id ? String(t.tecnico_id) : '');
      if (tecs) setTecnicos(tecs);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const updated = await updateTicket(id, {
        estado: editEstado,
        urgencia: editUrgencia,
        tecnico_id: editTecnico ? Number(editTecnico) : null,
      });
      setTicket(updated);
      // Refrescar historial
      getTicketHistory(id).then(setHistory);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSendingNote(true);
    try {
      const entry = await addTicketNote(id, { tipo: noteType, contenido: noteText });
      setHistory((prev) => [...prev, entry]);
      setNoteText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al enviar');
    } finally {
      setSendingNote(false);
    }
  };

  const hasChanges = ticket && (
    editEstado !== ticket.estado ||
    editUrgencia !== ticket.urgencia ||
    String(editTecnico || '') !== String(ticket.tecnico_id || '')
  );

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">

          <button onClick={() => navigate('/soporte')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand transition">
            ← Volver a Soporte
          </button>

          {loading ? (
            <p className="text-slate-400 text-sm">Cargando...</p>
          ) : !ticket ? (
            <p className="text-slate-400 text-sm">Ticket no encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ====== Columna izquierda: Info + Acciones ====== */}
              <div className="lg:col-span-1 flex flex-col gap-6">

                {/* Info del ticket */}
                <div className="bg-surface rounded-3xl border border-surface-muted shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-mono text-slate-400">#{String(ticket.id).padStart(4, '0')}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE[ticket.estado] || ''}`}>
                      {ticket.estado}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs ${URGENCIA_BADGE[ticket.urgencia] || ''}`}>
                      {ticket.urgencia}
                    </span>
                  </div>

                  <h1 className="text-xl font-bold text-brand mb-2">{ticket.titulo}</h1>
                  {ticket.descripcion && (
                    <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">{ticket.descripcion}</p>
                  )}

                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tipo</span>
                      <span className="text-slate-700">{ticket.tipo_incidencia}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Solicitante</span>
                      <span className="text-slate-700">{ticket.user_nombre}</span>
                    </div>
                    {ticket.item_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Activo</span>
                        <span className="text-slate-700">{ticket.item_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Técnico</span>
                      <span className="text-slate-700">{ticket.tecnico_nombre || 'Sin asignar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Creado</span>
                      <span className="text-slate-700">{formatDateTime(ticket.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actualizado</span>
                      <span className="text-slate-700">{timeAgo(ticket.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones del operador */}
                {isOperator && (
                  <div className="bg-surface rounded-3xl border border-surface-muted shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Gestión</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                        <select value={editEstado} onChange={(e) => setEditEstado(e.target.value)} className={INPUT}>
                          {ESTADOS.map((e) => <option key={e}>{e}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Urgencia</label>
                        <select value={editUrgencia} onChange={(e) => setEditUrgencia(e.target.value)} className={INPUT}>
                          {URGENCIAS.map((u) => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      {isAdmin && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Técnico asignado</label>
                          <select value={editTecnico} onChange={(e) => setEditTecnico(e.target.value)} className={INPUT}>
                            <option value="">Sin asignar</option>
                            {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                          </select>
                        </div>
                      )}
                      <button
                        onClick={handleSaveChanges}
                        disabled={!hasChanges || saving}
                        style={hasChanges ? { backgroundColor: '#033c63', color: '#fff' } : {}}
                        className={`rounded-full py-2 text-sm font-medium transition ${
                          hasChanges
                            ? 'hover:opacity-90'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ====== Columna derecha: Historial ====== */}
              <div className="lg:col-span-2">
                <div className="bg-surface rounded-3xl border border-surface-muted shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Historial</h3>

                  {/* Timeline */}
                  <div className="relative">
                    {history.length > 0 && (
                      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />
                    )}

                    <div className="flex flex-col gap-4">
                      {history.map((h) => {
                        const cfg = HISTORY_ICON[h.tipo] || { icon: '•', color: 'bg-slate-400' };
                        const isNote = h.tipo === 'nota_privada' || h.tipo === 'comunicacion';

                        return (
                          <div key={h.id} className="flex gap-3 relative">
                            <div className={`w-8 h-8 rounded-full ${cfg.color} flex items-center justify-center text-white text-xs shrink-0 z-10`}>
                              {cfg.icon}
                            </div>
                            <div className={`flex-1 rounded-2xl p-4 ${
                              h.tipo === 'nota_privada'
                                ? 'bg-slate-50 border border-dashed border-slate-300'
                                : h.tipo === 'comunicacion'
                                ? 'bg-cyan-50 border border-cyan-200'
                                : 'bg-slate-50'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-700">{h.user_nombre}</span>
                                <span className="text-xs text-slate-400">{timeAgo(h.created_at)}</span>
                                {h.tipo === 'nota_privada' && (
                                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Nota privada</span>
                                )}
                                {h.tipo === 'comunicacion' && (
                                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">Comunicación</span>
                                )}
                              </div>

                              {isNote ? (
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{h.contenido}</p>
                              ) : h.tipo === 'creacion' ? (
                                <p className="text-sm text-slate-500">{h.contenido}</p>
                              ) : (
                                <p className="text-sm text-slate-600">
                                  {h.tipo === 'cambio_estado' && <>Estado: <span className="line-through text-slate-400">{h.valor_anterior}</span> → <span className="font-medium">{h.valor_nuevo}</span></>}
                                  {h.tipo === 'cambio_urgencia' && <>Urgencia: <span className="line-through text-slate-400">{h.valor_anterior}</span> → <span className="font-medium">{h.valor_nuevo}</span></>}
                                  {h.tipo === 'asignacion' && <>Técnico: <span className="line-through text-slate-400">{h.valor_anterior}</span> → <span className="font-medium">{h.valor_nuevo}</span></>}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {history.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-6">Sin actividad registrada.</p>
                      )}
                    </div>
                  </div>

                  {/* Agregar nota/comunicación */}
                  <form onSubmit={handleSendNote} className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex gap-3 items-start">
                      {isOperator && (
                        <select value={noteType} onChange={(e) => setNoteType(e.target.value)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#033c63] transition shrink-0">
                          <option value="comunicacion">Comunicación</option>
                          <option value="nota_privada">Nota privada</option>
                        </select>
                      )}
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className={INPUT + ' resize-none flex-1'}
                        rows={2}
                        placeholder={isOperator
                          ? (noteType === 'nota_privada' ? 'Nota interna entre técnicos...' : 'Mensaje visible para el usuario...')
                          : 'Escribe un mensaje...'
                        }
                      />
                      <button
                        type="submit"
                        disabled={sendingNote || !noteText.trim()}
                        style={{ backgroundColor: '#033c63', color: '#fff' }}
                        className="rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shrink-0 self-end"
                      >
                        {sendingNote ? '...' : 'Enviar'}
                      </button>
                    </div>
                    {isOperator && noteType === 'nota_privada' && (
                      <p className="text-xs text-slate-400 mt-2 ml-1">Esta nota solo será visible para operadores y administradores.</p>
                    )}
                  </form>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
