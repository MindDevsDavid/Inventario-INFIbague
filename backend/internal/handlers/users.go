package handlers

import (
	"inventario/backend/internal/database"
	"inventario/backend/internal/models"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// GET /api/users — incluye datos del encargado vinculado
func GetUsers(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT u.id, u.username, u.rol, u.activo,
		       COALESCE(e.nombre, ''), COALESCE(e.cargo, ''), COALESCE(e.email, ''),
		       e.id
		FROM users u
		LEFT JOIN encargados e ON e.user_id = u.id
		ORDER BY u.id ASC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	list := []models.User{}
	for rows.Next() {
		var u models.User
		var encID *int
		if err := rows.Scan(&u.ID, &u.Username, &u.Rol, &u.Activo,
			&u.Nombre, &u.Cargo, &u.Email, &encID); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		u.EncargadoID = encID
		list = append(list, u)
	}
	return c.JSON(list)
}

// POST /api/users — crea usuario y su encargado vinculado automáticamente
func CreateUser(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Rol      string `json:"rol"`
		Nombre   string `json:"nombre"`
		Cargo    string `json:"cargo"`
		Email    string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	body.Username = strings.TrimSpace(body.Username)
	body.Nombre = strings.TrimSpace(body.Nombre)
	body.Cargo = strings.TrimSpace(body.Cargo)
	body.Email = strings.TrimSpace(body.Email)

	if body.Username == "" || body.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "usuario y contraseña son obligatorios"})
	}
	if body.Nombre == "" {
		return c.Status(400).JSON(fiber.Map{"error": "el nombre completo es obligatorio"})
	}
	if len(body.Password) < 6 {
		return c.Status(400).JSON(fiber.Map{"error": "la contraseña debe tener al menos 6 caracteres"})
	}
	if body.Rol != "admin" && body.Rol != "tecnico" && body.Rol != "usuario" {
		body.Rol = "usuario"
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "error procesando contraseña"})
	}

	var u models.User
	err = database.DB.QueryRow(
		"INSERT INTO users (username, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, username, rol, activo",
		body.Username, string(hash), body.Rol,
	).Scan(&u.ID, &u.Username, &u.Rol, &u.Activo)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			return c.Status(409).JSON(fiber.Map{"error": "ese nombre de usuario ya existe"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Crear encargado vinculado
	var encID int
	database.DB.QueryRow(
		"INSERT INTO encargados (nombre, cargo, email, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
		body.Nombre, body.Cargo, body.Email, u.ID,
	).Scan(&encID)

	u.Nombre = body.Nombre
	u.Cargo = body.Cargo
	u.Email = body.Email
	u.EncargadoID = &encID

	return c.Status(201).JSON(u)
}

// PUT /api/users/:id — actualiza usuario y encargado vinculado
func UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Rol      string `json:"rol"`
		Nombre   string `json:"nombre"`
		Cargo    string `json:"cargo"`
		Email    string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	body.Username = strings.TrimSpace(body.Username)
	body.Nombre = strings.TrimSpace(body.Nombre)
	body.Cargo = strings.TrimSpace(body.Cargo)
	body.Email = strings.TrimSpace(body.Email)

	if body.Username == "" {
		return c.Status(400).JSON(fiber.Map{"error": "el nombre de usuario es obligatorio"})
	}
	if body.Nombre == "" {
		return c.Status(400).JSON(fiber.Map{"error": "el nombre completo es obligatorio"})
	}
	if body.Rol != "admin" && body.Rol != "tecnico" && body.Rol != "usuario" {
		body.Rol = "usuario"
	}

	// Evitar que el admin se quite su propio rol
	claims := c.Locals("claims").(jwt.MapClaims)
	currentUser := claims["sub"].(string)
	var currentID int
	database.DB.QueryRow("SELECT id FROM users WHERE username = $1", currentUser).Scan(&currentID)
	if currentID == id && body.Rol != "admin" {
		return c.Status(400).JSON(fiber.Map{"error": "no puedes quitarte el rol de administrador"})
	}

	if body.Password != "" {
		if len(body.Password) < 6 {
			return c.Status(400).JSON(fiber.Map{"error": "la contraseña debe tener al menos 6 caracteres"})
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "error procesando contraseña"})
		}
		database.DB.Exec("UPDATE users SET password_hash = $1 WHERE id = $2", string(hash), id)
	}

	res, err := database.DB.Exec(
		"UPDATE users SET username = $1, rol = $2 WHERE id = $3",
		body.Username, body.Rol, id,
	)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			return c.Status(409).JSON(fiber.Map{"error": "ese nombre de usuario ya existe"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "usuario no encontrado"})
	}

	// Upsert encargado vinculado (crear si no existe, actualizar si ya existe)
	database.DB.Exec(`
		INSERT INTO encargados (nombre, cargo, email, user_id)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE
		  SET nombre = EXCLUDED.nombre,
		      cargo  = EXCLUDED.cargo,
		      email  = EXCLUDED.email
	`, body.Nombre, body.Cargo, body.Email, id)

	var u models.User
	var encID *int
	database.DB.QueryRow(`
		SELECT u.id, u.username, u.rol, u.activo,
		       COALESCE(e.nombre, ''), COALESCE(e.cargo, ''), COALESCE(e.email, ''),
		       e.id
		FROM users u
		LEFT JOIN encargados e ON e.user_id = u.id
		WHERE u.id = $1
	`, id).Scan(&u.ID, &u.Username, &u.Rol, &u.Activo, &u.Nombre, &u.Cargo, &u.Email, &encID)
	u.EncargadoID = encID

	return c.JSON(u)
}

// PATCH /api/users/:id/toggle
func ToggleUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	// No permitir desactivarse a uno mismo
	claims := c.Locals("claims").(jwt.MapClaims)
	currentUser := claims["sub"].(string)
	var currentID int
	database.DB.QueryRow("SELECT id FROM users WHERE username = $1", currentUser).Scan(&currentID)
	if currentID == id {
		return c.Status(400).JSON(fiber.Map{"error": "no puedes desactivar tu propia cuenta"})
	}

	res, err := database.DB.Exec("UPDATE users SET activo = NOT activo WHERE id = $1", id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "usuario no encontrado"})
	}

	// Sincronizar estado del encargado vinculado
	database.DB.Exec("UPDATE encargados SET activo = NOT activo WHERE user_id = $1", id)

	var activo bool
	database.DB.QueryRow("SELECT activo FROM users WHERE id = $1", id).Scan(&activo)
	return c.JSON(fiber.Map{"id": id, "activo": activo})
}
