package database

import (
	"database/sql"
	"inventario/backend/internal/config"
	"os"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB

func Init() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://inventario:inventario123@127.0.0.1:5433/inventario?sslmode=disable"
	}

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		return err
	}
	if err = DB.Ping(); err != nil {
		return err
	}

	if err = migrate(); err != nil {
		return err
	}
	return seed()
}

func migrate() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS users (
		id            SERIAL PRIMARY KEY,
		username      TEXT    NOT NULL UNIQUE,
		password_hash TEXT    NOT NULL,
		rol           TEXT    NOT NULL DEFAULT 'usuario',
		activo        BOOLEAN NOT NULL DEFAULT TRUE
	)`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS encargados (
		id      SERIAL PRIMARY KEY,
		nombre  TEXT    NOT NULL,
		cargo   TEXT    NOT NULL DEFAULT '',
		email   TEXT    NOT NULL DEFAULT '',
		activo  BOOLEAN NOT NULL DEFAULT TRUE
	)`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS items (
		id           SERIAL PRIMARY KEY,
		name         TEXT    NOT NULL,
		category     TEXT    NOT NULL,
		quantity     INTEGER NOT NULL DEFAULT 0,
		location     TEXT    NOT NULL,
		details      TEXT    NOT NULL DEFAULT '{}',
		encargado_id INTEGER REFERENCES encargados(id)
	)`)
	return err
}

func seed() error {
	// Seed usuario admin
	var userCount int
	DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if userCount == 0 {
		hash, err := bcrypt.GenerateFromPassword([]byte(config.AdminPassword), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		DB.Exec(
			"INSERT INTO users (username, password_hash, rol) VALUES ($1, $2, 'admin')",
			config.AdminUsername, string(hash),
		)
	}

	var count int
	if err := DB.QueryRow("SELECT COUNT(*) FROM encargados").Scan(&count); err != nil || count > 0 {
		return err
	}

	encargados := []struct{ nombre, cargo, email string }{
		{"Carlos Ramírez", "Administrador TI", "c.ramirez@empresa.com"},
		{"Laura Gómez", "Soporte Técnico", "l.gomez@empresa.com"},
		{"Andrés Torres", "Jefe de Sistemas", "a.torres@empresa.com"},
	}
	ids := make([]int, len(encargados))
	for i, e := range encargados {
		DB.QueryRow(
			"INSERT INTO encargados (nombre, cargo, email) VALUES ($1, $2, $3) RETURNING id",
			e.nombre, e.cargo, e.email,
		).Scan(&ids[i])
	}

	items := []struct {
		name, category, location, details string
		quantity, encargadoIdx            int
	}{
		{"Microsoft Office 365", "Programas", "Oficina Central", `{"version":"2021","fabricante":"Microsoft"}`, 20, 0},
		{"Adobe Photoshop", "Programas", "Oficina Creativa", `{"version":"25.0","fabricante":"Adobe"}`, 12, 0},
		{"Laptop Dell XPS 13", "Computadores", "Oficina A", `{"marca":"Dell","modelo":"XPS 13","procesador":"Intel Core i7","ram":"16 GB","almacenamiento":"512 GB SSD","sistema_operativo":"Windows 11","numero_serie":"DL-2024-001"}`, 8, 2},
		{"MacBook Pro 16\"", "Computadores", "Oficina B", `{"marca":"Apple","modelo":"MacBook Pro 16","procesador":"Apple M3 Pro","ram":"32 GB","almacenamiento":"1 TB SSD","sistema_operativo":"macOS Sonoma","numero_serie":"AP-2024-005"}`, 5, 2},
		{"iPhone 14", "Telefonos", "Soporte", `{"marca":"Apple","imei":"356938035643809","numero":"+57 300 000 0001","sistema_operativo":"iOS 17"}`, 10, 1},
		{"Samsung Galaxy S23", "Telefonos", "Soporte", `{"marca":"Samsung","imei":"490154203237518","numero":"+57 310 000 0002","sistema_operativo":"Android 14"}`, 4, 1},
		{"UPS APC Back-UPS 1500VA", "UPSs", "Data Center", `{"marca":"APC","modelo":"Back-UPS 1500","capacidad":"1500VA"}`, 6, 2},
		{"UPS Eaton 9PX", "UPSs", "Servidor", `{"marca":"Eaton","modelo":"9PX 2000","capacidad":"2000VA"}`, 3, 2},
		{"Licencia Windows Server", "Licencias", "Oficina TI", `{"proveedor":"Microsoft","clave":"XXXXX-XXXXX-XXXXX-XXXXX","tipo":"Volumen","vencimiento":"2026-12-31"}`, 15, 0},
		{"Licencia Adobe Creative Cloud", "Licencias", "Oficina Creativa", `{"proveedor":"Adobe","clave":"AAAAA-BBBBB-CCCCC-DDDDD","tipo":"Suscripción","vencimiento":"2025-12-31"}`, 10, 0},
		{"Monitor Samsung 27\"", "Monitores", "Oficina B", `{"marca":"Samsung","tamano":"27\"","resolucion":"2560x1440"}`, 10, 1},
		{"Monitor LG UltraWide 34\"", "Monitores", "Oficina A", `{"marca":"LG","tamano":"34\"","resolucion":"3440x1440"}`, 6, 1},
		{"Impresora HP LaserJet", "Impresoras", "Oficina C", `{"marca":"HP","modelo":"LaserJet Pro M404n","tipo":"Láser","ip":"192.168.1.50"}`, 9, 1},
		{"Impresora Epson EcoTank", "Impresoras", "Recepcion", `{"marca":"Epson","modelo":"EcoTank L3250","tipo":"Inyección de tinta","ip":"192.168.1.51"}`, 3, 1},
	}

	for _, item := range items {
		DB.Exec(
			"INSERT INTO items (name, category, quantity, location, details, encargado_id) VALUES ($1, $2, $3, $4, $5, $6)",
			item.name, item.category, item.quantity, item.location, item.details, ids[item.encargadoIdx],
		)
	}
	return nil
}
