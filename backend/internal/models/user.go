package models

type User struct {
	ID          int    `json:"id"`
	Username    string `json:"username"`
	Rol         string `json:"rol"`
	Activo      bool   `json:"activo"`
	Nombre      string `json:"nombre"`
	Cargo       string `json:"cargo"`
	Email       string `json:"email"`
	Oficina     string `json:"oficina"`
	EncargadoID *int   `json:"encargado_id,omitempty"`
}
