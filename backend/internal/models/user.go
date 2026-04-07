package models

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Rol      string `json:"rol"`
	Activo   bool   `json:"activo"`
}
