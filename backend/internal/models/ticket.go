package models

import "time"

type Ticket struct {
	ID             int       `json:"id"`
	Titulo         string    `json:"titulo"`
	TipoIncidencia string    `json:"tipo_incidencia"`
	Descripcion    string    `json:"descripcion"`
	Urgencia       string    `json:"urgencia"`
	Estado         string    `json:"estado"`
	ItemID         *int      `json:"item_id"`
	ItemName       string    `json:"item_name"`
	UserID         int       `json:"user_id"`
	UserNombre     string    `json:"user_nombre"`
	TecnicoID      *int      `json:"tecnico_id"`
	TecnicoNombre  string    `json:"tecnico_nombre"`
	Notas          string    `json:"notas"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
