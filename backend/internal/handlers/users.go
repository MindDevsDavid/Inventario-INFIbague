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

// GET /api/users
func GetUsers(c *fiber.Ctx) error {
	rows, err := database.DB.Query(
		"SELECT id, username, rol, activo FROM users ORDER BY id ASC",
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	list := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Rol, &u.Activo); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		list = append(list, u)
	}
	return c.JSON(list)
}

// POST /api/users
func CreateUser(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Rol      string `json:"rol"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	body.Username = strings.TrimSpace(body.Username)
	if body.Username == "" || body.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "usuario y contraseña son obligatorios"})
	}
	if len(body.Password) < 6 {
		return c.Status(400).JSON(fiber.Map{"error": "la contraseña debe tener al menos 6 caracteres"})
	}
	if body.Rol != "admin" && body.Rol != "usuario" {
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
	return c.Status(201).JSON(u)
}

// PUT /api/users/:id  — actualiza username, rol y opcionalmente contraseña
func UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Rol      string `json:"rol"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	body.Username = strings.TrimSpace(body.Username)
	if body.Username == "" {
		return c.Status(400).JSON(fiber.Map{"error": "el nombre de usuario es obligatorio"})
	}
	if body.Rol != "admin" && body.Rol != "usuario" {
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
		database.DB.Exec(
			"UPDATE users SET password_hash = $1 WHERE id = $2", string(hash), id,
		)
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

	var u models.User
	database.DB.QueryRow(
		"SELECT id, username, rol, activo FROM users WHERE id = $1", id,
	).Scan(&u.ID, &u.Username, &u.Rol, &u.Activo)
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

	res, err := database.DB.Exec(
		"UPDATE users SET activo = NOT activo WHERE id = $1", id,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "usuario no encontrado"})
	}

	var activo bool
	database.DB.QueryRow("SELECT activo FROM users WHERE id = $1", id).Scan(&activo)
	return c.JSON(fiber.Map{"id": id, "activo": activo})
}
