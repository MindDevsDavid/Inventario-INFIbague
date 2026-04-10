import { useState, useEffect } from 'react';
import { CATEGORY_FIELDS, CATEGORY_CONFIG } from '../config/categoryFields';
import { createItem, updateItem, getEncargados } from '../services/api';

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] transition';

export default function ItemModal({ category, item = null, onClose, onSaved }) {
  const isEdit = item !== null;
  const fields = CATEGORY_FIELDS[category] || [];
  const config = CATEGORY_CONFIG[category] || {};

  const buildForm = () => ({
    name: item?.name || '',
    quantity: item?.quantity ?? 1,
    location: item?.location || '',
    encargado_id: item?.encargado_id ?? '',
    ...Object.fromEntries(fields.map((f) => [f.key, item?.details?.[f.key] || ''])),
  });

  const [form, setForm] = useState(buildForm);
  const [encargados, setEncargados] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(buildForm()); }, [category, item]);
  useEffect(() => { getEncargados().then(setEncargados).catch(console.error); }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar campos requeridos de details
    for (const f of fields) {
      if (f.required && !form[f.key]) {
        setError(`El campo "${f.label}" es obligatorio.`);
        return;
      }
    }
    if (config.requireEncargado && !form.encargado_id) {
      setError('El campo "Encargado" es obligatorio.');
      return;
    }

    setSaving(true);
    const details = Object.fromEntries(
      fields.map((f) => [f.key, form[f.key] || ''])
    );

    const payload = {
      name: form.name,
      category,
      quantity: config.hideQuantity ? 1 : (parseInt(form.quantity) || 1),
      location: form.location,
      details,
      encargado_id: form.encargado_id ? parseInt(form.encargado_id) : null,
    };

    try {
      if (isEdit) await updateItem(item.id, payload);
      else await createItem(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    const label = (
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {field.label}
        {field.required
          ? <span className="text-red-500 ml-1">*</span>
          : <span className="text-slate-400 text-xs ml-1">(opcional)</span>
        }
      </label>
    );

    if (field.type === 'select') {
      return (
        <div key={field.key}>
          {label}
          <select
            value={form[field.key]}
            onChange={(e) => set(field.key, e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">— Seleccionar —</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key}>
          {label}
          <textarea
            value={form[field.key]}
            onChange={(e) => set(field.key, e.target.value)}
            className={`${INPUT_CLASS} resize-none`}
            rows={3}
            placeholder={field.placeholder || ''}
          />
        </div>
      );
    }

    return (
      <div key={field.key}>
        {label}
        <input
          type={field.type}
          value={form[field.key]}
          onChange={(e) => set(field.key, e.target.value)}
          className={INPUT_CLASS}
          placeholder={field.placeholder || ''}
        />
      </div>
    );
  };

  // Separar campos obligatorios y opcionales para agruparlos visualmente
  const requiredFields = fields.filter((f) => f.required);
  const optionalFields = fields.filter((f) => !f.required);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#033c63' }}>
            {isEdit ? `Editar ${category}` : `Agregar ${category}`}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Nombre del activo"
              />
            </div>

            {/* Encargado */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Encargado
                {config.requireEncargado
                  ? <span className="text-red-500 ml-1">*</span>
                  : <span className="text-slate-400 text-xs ml-1">(opcional)</span>
                }
              </label>
              <select
                value={form.encargado_id}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  set('encargado_id', selectedId);
                  const enc = encargados.find((en) => String(en.id) === selectedId);
                  set('location', enc?.cargo || '');
                }}
                className={INPUT_CLASS}
              >
                <option value="">— Sin asignar —</option>
                {encargados.map((enc) => (
                  <option key={enc.id} value={enc.id}>
                    {enc.nombre}{enc.cargo ? ` — ${enc.cargo}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Ubicación — se llena automáticamente con la oficina del encargado */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Localización <span className="text-red-500">*</span>
              </label>
              <input
                required
                readOnly
                value={form.location}
                className={`${INPUT_CLASS} bg-slate-50 text-slate-500 cursor-not-allowed`}
                placeholder="Se completa al seleccionar un encargado"
              />
            </div>

            {/* Campos obligatorios de la categoría */}
            {requiredFields.map(renderField)}

            {/* Cantidad (solo si la categoría la usa) */}
            {!config.hideQuantity && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            )}

            {/* Campos opcionales de la categoría */}
            {optionalFields.length > 0 && (
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Campos opcionales</p>
                {optionalFields.map(renderField)}
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: '#033c63', color: '#fff' }}
                className="flex-1 rounded-full py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
              >
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
