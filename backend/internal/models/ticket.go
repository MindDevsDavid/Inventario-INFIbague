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
	ItemCategory   string    `json:"item_category"`
	UserID         int       `json:"user_id"`
	UserNombre     string    `json:"user_nombre"`
	TecnicoID      *int      `json:"tecnico_id"`
	TecnicoNombre  string    `json:"tecnico_nombre"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type TicketHistory struct {
	ID            int       `json:"id"`
	TicketID      int       `json:"ticket_id"`
	UserID        int       `json:"user_id"`
	UserNombre    string    `json:"user_nombre"`
	Tipo          string    `json:"tipo"` // cambio_estado, cambio_urgencia, asignacion, nota_privada, comunicacion
	Contenido     string    `json:"contenido"`
	ValorAnterior string    `json:"valor_anterior"`
	ValorNuevo    string    `json:"valor_nuevo"`
	CreatedAt     time.Time `json:"created_at"`
}
