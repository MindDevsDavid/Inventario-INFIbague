package database

import (
	"database/sql"
	_ "modernc.org/sqlite"
)

var DB *sql.DB

func Init() error {
	var err error
	DB, err = sql.Open("sqlite", "./inventario.db")
	if err != nil {
		return err
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS items (
		id       INTEGER PRIMARY KEY AUTOINCREMENT,
		name     TEXT    NOT NULL,
		category TEXT    NOT NULL,
		quantity INTEGER NOT NULL DEFAULT 0,
		location TEXT    NOT NULL,
		details  TEXT    NOT NULL DEFAULT '{}'
	)`)
	if err != nil {
		return err
	}

	// Migración: agregar columna details si no existe (base de datos existente)
	DB.Exec(`ALTER TABLE items ADD COLUMN details TEXT NOT NULL DEFAULT '{}'`)

	return seed()
}

func seed() error {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM items").Scan(&count)
	if err != nil || count > 0 {
		return err
	}

	items := []struct {
		name, category, location, details string
		quantity                          int
	}{
		{"Microsoft Office 365", "Programas", "Oficina Central", `{"version":"2021","fabricante":"Microsoft"}`, 20},
		{"Adobe Photoshop", "Programas", "Oficina Creativa", `{"version":"25.0","fabricante":"Adobe"}`, 12},
		{"Laptop Dell XPS 13", "Computadores", "Oficina A", `{"marca":"Dell","modelo":"XPS 13","procesador":"Intel Core i7","ram":"16 GB","almacenamiento":"512 GB SSD","sistema_operativo":"Windows 11","numero_serie":"DL-2024-001"}`, 8},
		{"MacBook Pro 16\"", "Computadores", "Oficina B", `{"marca":"Apple","modelo":"MacBook Pro 16","procesador":"Apple M3 Pro","ram":"32 GB","almacenamiento":"1 TB SSD","sistema_operativo":"macOS Sonoma","numero_serie":"AP-2024-005"}`, 5},
		{"iPhone 14", "Telefonos", "Soporte", `{"marca":"Apple","imei":"356938035643809","numero":"+57 300 000 0001","sistema_operativo":"iOS 17"}`, 10},
		{"Samsung Galaxy S23", "Telefonos", "Soporte", `{"marca":"Samsung","imei":"490154203237518","numero":"+57 310 000 0002","sistema_operativo":"Android 14"}`, 4},
		{"UPS APC Back-UPS 1500VA", "UPSs", "Data Center", `{"marca":"APC","modelo":"Back-UPS 1500","capacidad":"1500VA"}`, 6},
		{"UPS Eaton 9PX", "UPSs", "Servidor", `{"marca":"Eaton","modelo":"9PX 2000","capacidad":"2000VA"}`, 3},
		{"Licencia Windows Server", "Licencias", "Oficina TI", `{"proveedor":"Microsoft","clave":"XXXXX-XXXXX-XXXXX-XXXXX","tipo":"Volumen","vencimiento":"2026-12-31"}`, 15},
		{"Licencia Adobe Creative Cloud", "Licencias", "Oficina Creativa", `{"proveedor":"Adobe","clave":"AAAAA-BBBBB-CCCCC-DDDDD","tipo":"Suscripción","vencimiento":"2025-12-31"}`, 10},
		{"Monitor Samsung 27\"", "Monitores", "Oficina B", `{"marca":"Samsung","tamano":"27\"","resolucion":"2560x1440"}`, 10},
		{"Monitor LG UltraWide 34\"", "Monitores", "Oficina A", `{"marca":"LG","tamano":"34\"","resolucion":"3440x1440"}`, 6},
		{"Impresora HP LaserJet", "Impresoras", "Oficina C", `{"marca":"HP","modelo":"LaserJet Pro M404n","tipo":"Láser","ip":"192.168.1.50"}`, 9},
		{"Impresora Epson EcoTank", "Impresoras", "Recepcion", `{"marca":"Epson","modelo":"EcoTank L3250","tipo":"Inyección de tinta","ip":"192.168.1.51"}`, 3},
	}

	for _, item := range items {
		_, err := DB.Exec(
			"INSERT INTO items (name, category, quantity, location, details) VALUES (?, ?, ?, ?, ?)",
			item.name, item.category, item.quantity, item.location, item.details,
		)
		if err != nil {
			return err
		}
	}
	return nil
}
