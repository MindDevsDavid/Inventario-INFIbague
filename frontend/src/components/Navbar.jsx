import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const categories = [
  'Computadores',
  'Telefonos',
  'UPSs',
  'Licencias',
  'Monitores',
  'Impresoras',
  'Escáneres',
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();
  const isAdmin = sessionStorage.getItem('role') === 'admin';

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  return (
    <header className="bg-brand text-surface shadow-lg shadow-slate-900/10">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link to="/dashboard" className="text-lg font-semibold tracking-wide">
          Inventario TI
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <Link
              to="/inventory"
              className="inline-flex items-center rounded-full border border-surface/20 bg-surface px-4 py-2 text-sm font-medium text-slate-700"
            >
              Activos
            </Link>
            {open && (
              <div className="absolute right-0 z-50 mt-0 w-56 overflow-hidden rounded-3xl bg-[#022a45] text-white shadow-2xl border-0">
                 <div className="flex flex-col bg-[#022a45]">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/inventory?category=${encodeURIComponent(category)}`}
                      className="px-4 py-3 text-sm text-white transition hover:bg-[#033c63]"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/encargados"
            className="inline-flex items-center rounded-full border border-surface/20 bg-surface px-4 py-2 text-sm font-medium text-slate-700"
          >
            Encargados
          </Link>

          {isAdmin && (
            <Link
              to="/usuarios"
              className="inline-flex items-center rounded-full border border-surface/20 bg-surface px-4 py-2 text-sm font-medium text-slate-700"
            >
              Usuarios
            </Link>
          )}

          <button
            type="button"
            className="inline-flex items-center rounded-full border border-surface/20 bg-surface px-4 py-2 text-sm font-medium text-slate-700"
          >
            Soporte
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center rounded-full border border-surface/20 bg-surface px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
