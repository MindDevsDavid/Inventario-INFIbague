import { useState, useEffect } from 'react';
import { CATEGORY_FIELDS } from '../config/categoryFields';
import { createItem, updateItem } from '../services/api';

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] transition';

export default function ItemModal({ category, item = null, onClose, onSaved }) {
  const isEdit = item !== null;
  const fields = CATEGORY_FIELDS[category] || [];

  const buildForm = () => ({
    name: item?.name || '',
    quantity: item?.quantity ?? 0,
    location: item?.location || '',
    ...Object.fromEntries(fields.map((f) => [f.key, item?.details?.[f.key] || ''])),
  });

  const [form, setForm] = useState(buildForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(buildForm()); }, [category, item]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const details = Object.fromEntries(
      fields.map((f) => [f.key, form[f.key] || ''])
    );

    const payload = {
      name: form.name,
      category,
      quantity: parseInt(form.quantity) || 0,
      location: form.location,
      details,
    };

    try {
      if (isEdit) {
        await updateItem(item.id, payload);
      } else {
        await createItem(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#033c63' }}>
            {isEdit ? `Editar ${category}` : `Agregar ${category}`}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {isEdit ? 'Modifica los campos que necesites.' : 'Completa la información del nuevo activo.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Campos comunes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={INPUT_CLASS}
                placeholder={`Nombre del activo`}
              />
            </div>

            {/* Campos específicos de la categoría */}
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                {field.type === 'select' ? (
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
                ) : (
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(e) => set(field.key, e.target.value)}
                    className={INPUT_CLASS}
                    placeholder={field.placeholder || ''}
                  />
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
                <input
                  required
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Ej: Oficina Central"
                />
              </div>
            </div>

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
