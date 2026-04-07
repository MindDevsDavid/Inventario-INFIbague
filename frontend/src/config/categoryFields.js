export const CATEGORIES = [
  'Programas',
  'Computadores',
  'Telefonos',
  'UPSs',
  'Licencias',
  'Monitores',
  'Impresoras',
];

// Campos específicos de cada categoría (además de nombre, cantidad y ubicación que son comunes)
export const CATEGORY_FIELDS = {
  Programas: [
    { key: 'version', label: 'Versión', type: 'text', placeholder: 'Ej: 2021' },
    { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'Ej: Microsoft' },
  ],
  Computadores: [
    { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Dell' },
    { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: XPS 13' },
    { key: 'procesador', label: 'Procesador', type: 'text', placeholder: 'Ej: Intel Core i7' },
    { key: 'ram', label: 'RAM', type: 'text', placeholder: 'Ej: 16 GB' },
    { key: 'almacenamiento', label: 'Almacenamiento', type: 'text', placeholder: 'Ej: 512 GB SSD' },
    { key: 'sistema_operativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Windows 11' },
    { key: 'numero_serie', label: 'Número de Serie', type: 'text', placeholder: 'Ej: DL-2024-001' },
  ],
  Telefonos: [
    { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Samsung' },
    { key: 'imei', label: 'IMEI', type: 'text', placeholder: 'Ej: 356938035643809' },
    { key: 'numero', label: 'Número Telefónico', type: 'text', placeholder: 'Ej: +57 300 000 0001' },
    { key: 'sistema_operativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Android 14' },
  ],
  UPSs: [
    { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: APC' },
    { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: Back-UPS 1500' },
    { key: 'capacidad', label: 'Capacidad (VA)', type: 'text', placeholder: 'Ej: 1500VA' },
  ],
  Licencias: [
    { key: 'proveedor', label: 'Proveedor', type: 'text', placeholder: 'Ej: Microsoft' },
    { key: 'clave', label: 'Clave / Número de Licencia', type: 'text', placeholder: 'Ej: XXXXX-XXXXX-XXXXX' },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: ['Perpetua', 'Suscripción', 'Volumen'],
    },
    { key: 'vencimiento', label: 'Fecha de Vencimiento', type: 'date' },
  ],
  Monitores: [
    { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Samsung' },
    { key: 'tamano', label: 'Tamaño', type: 'text', placeholder: 'Ej: 27"' },
    { key: 'resolucion', label: 'Resolución', type: 'text', placeholder: 'Ej: 2560x1440' },
  ],
  Impresoras: [
    { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: HP' },
    { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: LaserJet Pro M404n' },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: ['Láser', 'Inyección de tinta', 'Multifuncional'],
    },
    { key: 'ip', label: 'IP de Red', type: 'text', placeholder: 'Ej: 192.168.1.100' },
  ],
};
