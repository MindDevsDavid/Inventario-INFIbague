import { useState, useEffect } from 'react';
import { getMyAssets, createTicket } from '../services/api';

const TIPOS = [
  'Falla de hardware',
  'Error de software',
  'Solicitud de insumos',
  'Acceso y permisos',
  'Mantenimiento preventivo',
  'Daño físico',
  'Conectividad / Red',
  'Otro',
];

const URGENCIAS = [
  { value: 'Baja',    label: 'Baja',    color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'Media',   label: 'Media',   color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'Alta',    label: 'Alta',    color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'Crítica', label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-300' },
];

const INPUT = 'w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] transition';

export default function TicketModal({ onClose, onCreated }) {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({
    titulo: '',
    tipo_incidencia: '',
    descripcion: '',
    urgencia: 'Media',
    item_id: null,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyAssets().then(setAssets).catch(console.error);
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tipo_incidencia) { setError('Selecciona el tipo de incidencia'); return; }
    setError('');
    setSaving(true);
    try {
      const ticket = await createTicket(form);
      onCreated(ticket);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-8">
        <h2 className="text-xl font-bold mb-1" style={{ color: '#033c63' }}>Nueva solicitud</h2>
        <p className="text-sm text-slate-400 mb-6">Los campos marcados con <span className="text-red-500">*</span> son obligatorios.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Activo afectado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Activo afectado <span className="text-slate-400 text-xs">(opcional)</span>
            </label>
            <select
              value={form.item_id ?? ''}
              onChange={(e) => set('item_id', e.target.value ? Number(e.target.value) : null)}
              className={INPUT}
            >
              <option value="">— Sin activo específico —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.category}
                </option>
              ))}
            </select>
            {assets.length === 0 && (
              <p className="mt-1 text-xs text-slate-400">No hay activos asignados a tu oficina.</p>
            )}
          </div>

          {/* Tipo de incidencia */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo de incidencia <span className="text-red-500">*</span>
            </label>
            <select required value={form.tipo_incidencia} onChange={(e) => set('tipo_incidencia', e.target.value)} className={INPUT}>
              <option value="">— Seleccionar —</option>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              className={INPUT}
              placeholder="Describe brevemente el problema"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción <span className="text-slate-400 text-xs">(opcional)</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              className={INPUT + ' resize-none'}
              rows={3}
              placeholder="Detalla el problema, cuándo ocurrió, qué intentaste hacer..."
            />
          </div>

          {/* Urgencia */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Urgencia que consideras <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {URGENCIAS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => set('urgencia', u.value)}
                  className={`rounded-xl border-2 py-2 text-xs font-semibold transition ${
                    form.urgencia === u.value ? u.color + ' border-current' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button type="submit" disabled={saving}
              style={{ backgroundColor: '#033c63', color: '#fff' }}
              className="flex-1 rounded-full py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">
              {saving ? 'Enviando...' : 'Enviar solicitud'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
