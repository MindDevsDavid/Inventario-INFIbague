import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');

  useEffect(() => {
    // Mock data - replace with API call
    setItems([
      { id: 1, name: 'Microsoft Office 365', category: 'Programas', quantity: 20, location: 'Oficina Central' },
      { id: 2, name: 'Adobe Photoshop', category: 'Programas', quantity: 12, location: 'Oficina Creativa' },
      { id: 3, name: 'Laptop Dell XPS 13', category: 'Computadores', quantity: 8, location: 'Oficina A' },
      { id: 4, name: 'MacBook Pro 16"', category: 'Computadores', quantity: 5, location: 'Oficina B' },
      { id: 5, name: 'iPhone 14', category: 'Telefonos', quantity: 10, location: 'Soporte' },
      { id: 6, name: 'Samsung Galaxy S23', category: 'Telefonos', quantity: 4, location: 'Soporte' },
      { id: 7, name: 'UPS APC Back-UPS 1500VA', category: 'UPSs', quantity: 6, location: 'Data Center' },
      { id: 8, name: 'UPS Eaton 9PX', category: 'UPSs', quantity: 3, location: 'Servidor' },
      { id: 9, name: 'Licencia Windows Server', category: 'Licencias', quantity: 15, location: 'Oficina TI' },
      { id: 10, name: 'Licencia Adobe Creative Cloud', category: 'Licencias', quantity: 10, location: 'Oficina Creativa' },
      { id: 11, name: 'Monitor Samsung 27"', category: 'Monitores', quantity: 10, location: 'Oficina B' },
      { id: 12, name: 'Impresora HP LaserJet', category: 'Impresoras', quantity: 9, location: 'Oficina C' },
    ]);
  }, []);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  return (
    <div className="min-h-screen bg-surface-soft">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-brand mb-6">
            Inventario {selectedCategory ? `- ${selectedCategory}` : ''}
          </h1>
          <div className="bg-surface rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-surface-muted">
            <table className="w-full table-auto">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ubicación</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-muted">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand">{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;