import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navbar from '../components/Navbar';
import ItemModal from '../components/ItemModal';
import { getItems, deleteItem } from '../services/api';
import { CATEGORIES, CATEGORY_FIELDS } from '../config/categoryFields';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');

  const role = sessionStorage.getItem('role');
  const isUsuario = role === 'usuario';
  const canAdd    = role === 'admin' || role === 'tecnico';
  const canEdit   = role === 'admin' || role === 'tecnico';
  const canDelete = role === 'admin';

  const [modal, setModal] = useState(null);   // { mode: 'add'|'edit', category, item? }
  const [detailItem, setDetailItem] = useState(null); // item para modal de detalle (usuario)
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchItems = () =>
    getItems(selectedCategory).then(setItems).catch(console.error);

  useEffect(() => { fetchItems(); }, [selectedCategory]);
  useEffect(() => { setSearch(''); setFilterCategory(''); }, [selectedCategory]);

  const handleDelete = async () => {
    await deleteItem(confirmDelete).catch(console.error);
    setConfirmDelete(null);
    fetchItems();
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 14;
    const marginRight = 14;
    const contentWidth = pageWidth - marginLeft - marginRight;

    const encargadoName = sessionStorage.getItem('encargado_nombre') || sessionStorage.getItem('username') || '';
    const encargadoCargo = sessionStorage.getItem('encargado_cargo') || '';

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const hoy = new Date();
    const fechaStr = `Ibague, ${String(hoy.getDate()).padStart(2,'0')} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

    const addHeader = () => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('INSTITUTO DE FINANCIAMIENTO, PROMOCION Y DESARROLLO DE IBAGUE', pageWidth / 2, 15, { align: 'center' });
      doc.text('INFIBAGUE', pageWidth / 2, 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('NIT: 890.700.755.-5', pageWidth / 2, 25, { align: 'center' });
    };

    const addFooter = (pageNum, totalPages) => {
      const footerY = pageHeight - 15;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, footerY - 5, pageWidth - marginRight, footerY - 5);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'CLL. 60 CON CRA. 5a EDIF. CAMI NORTE B/ LA FLORESTA  TELEFONO: 2746888 - 2786888 - 2747444  FAX: 2746410',
        pageWidth / 2, footerY - 1, { align: 'center' }
      );
      doc.text(
        'E-MAIL: infibague@infibague.gov.co  WEB: www.infibague.gov.co  IBAGUE - TOLIMA',
        pageWidth / 2, footerY + 3, { align: 'center' }
      );
      doc.setFontSize(8);
      doc.text(`Pagina ${pageNum}/${totalPages}`, pageWidth / 2, footerY + 8, { align: 'center' });
    };

    // --- Página 1: encabezado completo ---
    addHeader();

    let y = 38;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE RESPONSABILIDAD', pageWidth / 2, y, { align: 'center' });

    y += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', marginLeft, y);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaStr, marginLeft + 20, y);

    y += 10;
    doc.setFontSize(8);
    doc.text(
      'Conforme al ARTICULO 38 de la Ley 1952 de 2019 Codigo General Disciplinario. Deberes:',
      marginLeft, y
    );

    y += 7;
    const art22 = '22. Vigilar y salvaguardar los bienes y valores que le han sido encomendados y cuidar que sean utilizados debida y racionalmente, de conformidad con los fines a que han sido destinados';
    const lines22 = doc.splitTextToSize(art22, contentWidth);
    doc.text(lines22, marginLeft, y);
    y += lines22.length * 4 + 3;

    const art23 = '23. Responder por la conservacion de los utiles, equipos, muebles y bienes confiados a su guarda o administracion y rendir cuenta oportuna de su utilizacion.';
    const lines23 = doc.splitTextToSize(art23, contentWidth);
    doc.text(lines23, marginLeft, y);
    y += lines23.length * 4 + 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVOS EN RESPONSABILIDAD', pageWidth / 2, y, { align: 'center' });
    y += 6;

    // --- Tabla de activos ---
    const tableData = filtered.map((item) => [
      item.details?.placa || '—',
      item.name,
      item.details?.fecha_compra || '—',
      item.details?.valor_compra
        ? Number(item.details.valor_compra).toLocaleString('es-CO')
        : '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['PLACA', 'DESCRIPCION', 'F. COMPRA', 'VALOR']],
      body: tableData,
      margin: { left: marginLeft, right: marginRight, bottom: 30 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 28 },
        1: { halign: 'center' },
        2: { halign: 'center', cellWidth: 28 },
        3: { halign: 'right', cellWidth: 28 },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addHeader();
        }
      },
    });

    // --- Página final: firma ---
    const lastTablePage = doc.internal.getNumberOfPages();
    const finalY = doc.lastAutoTable?.finalY || 150;

    if (finalY > pageHeight - 70) {
      doc.addPage();
    }

    const sigY = doc.internal.getNumberOfPages() === lastTablePage ? finalY + 30 : 50;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, sigY, marginLeft + 80, sigY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(encargadoName.toUpperCase(), marginLeft, sigY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (encargadoCargo) {
      doc.text(encargadoCargo, marginLeft, sigY + 12);
    }

    // --- Agregar headers y footers a todas las páginas ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      if (i > 1) addHeader();
      addFooter(i, totalPages);
    }

    doc.save('reporte_responsabilidad.pdf');
  };


  // Filtrado cliente: busca en todos los campos incluyendo details
  const filtered = items.filter((item) => {
    const catMatch = !filterCategory || item.category === filterCategory;
    if (!catMatch) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const detailValues = item.details ? Object.values(item.details).map(String) : [];
    const haystack = [
      String(item.id),
      item.name,
      item.category,
      item.location,
      item.encargado || '',
      String(item.quantity),
      ...detailValues,
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  });

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

            {isUsuario && (
              <button
                onClick={handleGenerateReport}
                style={{ backgroundColor: '#033c63', color: '#fff' }}
                className="rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition"
              >
                Generar Reporte
              </button>
            )}

            {canAdd && (selectedCategory ? (
              <button
                onClick={() => setModal({ mode: 'add', category: selectedCategory })}
                style={{ backgroundColor: '#033c63', color: '#fff' }}
                className="rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition"
              >
                + Agregar {selectedCategory}
              </button>
            ) : (
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
            ))}
          </div>

          {/* Buscador y filtro */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, marca, serie, ubicación..."
              className="flex-1 min-w-[220px] rounded-full border border-slate-200 px-5 py-2 text-sm outline-none focus:border-[#033c63] transition bg-surface"
            />
            {!selectedCategory && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#033c63] bg-surface"
              >
                <option value="">Todas las categorías</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            )}
            {(search || filterCategory) && (
              <button
                onClick={() => { setSearch(''); setFilterCategory(''); }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Tabla */}
          <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-surface-muted">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-surface-soft">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                    {!selectedCategory && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Placa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fabricante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Encargado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Oficina</th>
                    {(canEdit || canDelete) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-surface-muted">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={20} className="px-6 py-8 text-center text-sm text-slate-400">
                        {search || filterCategory ? 'Sin resultados para la búsqueda.' : 'No hay activos registrados.'}
                      </td>
                    </tr>
                  )}
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (canEdit) {
                          setModal({ mode: 'edit', category: item.category, item });
                        } else {
                          setDetailItem(item);
                        }
                      }}
                      className="cursor-pointer hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{item.name}</td>
                      {!selectedCategory && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.category}</td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.details?.placa || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.details?.fabricante || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.details?.estado ? (
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            item.details.estado === 'Excelente' ? 'bg-green-100 text-green-700' :
                            item.details.estado === 'Bueno'     ? 'bg-blue-100 text-blue-700' :
                            item.details.estado === 'Funcional' ? 'bg-amber-100 text-amber-700' :
                                                                   'bg-red-100 text-red-600'
                          }`}>{item.details.estado}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.encargado || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.location}</td>
                      {(canEdit || canDelete) && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            {canEdit && (
                              <button
                                onClick={() => setModal({ mode: 'edit', category: item.category, item })}
                                className="rounded-full border px-3 py-1 text-xs font-medium transition hover:text-white"
                                style={{ borderColor: '#033c63', color: '#033c63' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#033c63'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#033c63'; }}
                              >
                                Editar
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setConfirmDelete(item.id)}
                                className="rounded-full border border-red-400 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-500 hover:text-white transition"
                              >
                                Eliminar
                              </button>
                            )}
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

      {/* Modal detalle (solo lectura — usuarios) */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#033c63' }}>{detailItem.name}</h2>
              <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">{detailItem.category}</span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-400">Encargado</span>
                <span className="text-sm text-slate-700">{detailItem.encargado || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-400">Oficina</span>
                <span className="text-sm text-slate-700">{detailItem.location || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-400">Cantidad</span>
                <span className="text-sm text-slate-700">{detailItem.quantity}</span>
              </div>

              {(CATEGORY_FIELDS[detailItem.category] || []).map((field) => {
                const val = detailItem.details?.[field.key];
                if (!val && val !== 0) return null;
                return (
                  <div key={field.key} className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-400">{field.label}</span>
                    <span className="text-sm text-slate-700 text-right max-w-[60%]">{val}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setDetailItem(null)}
              className="mt-6 w-full rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
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
