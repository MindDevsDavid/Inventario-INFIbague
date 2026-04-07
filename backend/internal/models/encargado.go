package models

type Encargado struct {
	ID     int    `json:"id"`
	Nombre string `json:"nombre"`
	Cargo  string `json:"cargo"`
	Email  string `json:"email"`
	Activo bool   `json:"activo"`
}
