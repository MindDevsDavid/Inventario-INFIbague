package handlers

import (
	"inventario/backend/internal/database"
	"inventario/backend/internal/models"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// GET /api/encargados?all=1
func GetEncargados(c *fiber.Ctx) error {
	query := "SELECT id, nombre, cargo, email, activo FROM encargados"
	if c.Query("all") != "1" {
		query += " WHERE activo = true"
	}
	query += " ORDER BY nombre ASC"

	rows, err := database.DB.Query(query)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	list := []models.Encargado{}
	for rows.Next() {
		var e models.Encargado
		if err := rows.Scan(&e.ID, &e.Nombre, &e.Cargo, &e.Email, &e.Activo); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		list = append(list, e)
	}
	return c.JSON(list)
}

// POST /api/encargados
func CreateEncargado(c *fiber.Ctx) error {
	var e models.Encargado
	if err := c.BodyParser(&e); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cuerpo inválido"})
	}
	e.Nombre = strings.TrimSpace(e.Nombre)
	e.Cargo = strings.TrimSpace(e.Cargo)
	e.Email = strings.TrimSpace(e.Email)
	if e.Nombre == "" {
		return c.Status(400).JSON(fiber.Map{"error": "el nombre es obligatorio"})
	}
	if len(e.Nombre) > 150 {
		return c.Status(400).JSON(fiber.Map{"error": "nombre demasiado largo (máx 150 caracteres)"})
	}

	err := database.DB.QueryRow(
		"INSERT INTO encargados (nombre, cargo, email) VALUES ($1, $2, $3) RETURNING id",
		e.Nombre, e.Cargo, e.Email,
	).Scan(&e.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	e.Activo = true
	return c.Status(201).JSON(e)
}

// PUT /api/encargados/:id
func UpdateEncargado(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	var e models.Encargado
	if err := c.BodyParser(&e); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cuerpo inválido"})
	}
	e.Nombre = strings.TrimSpace(e.Nombre)
	e.Cargo = strings.TrimSpace(e.Cargo)
	e.Email = strings.TrimSpace(e.Email)
	if e.Nombre == "" {
		return c.Status(400).JSON(fiber.Map{"error": "el nombre es obligatorio"})
	}
	if len(e.Nombre) > 150 {
		return c.Status(400).JSON(fiber.Map{"error": "nombre demasiado largo (máx 150 caracteres)"})
	}

	res, err := database.DB.Exec(
		"UPDATE encargados SET nombre=$1, cargo=$2, email=$3 WHERE id=$4",
		e.Nombre, e.Cargo, e.Email, id,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "encargado no encontrado"})
	}
	e.ID = id
	return c.JSON(e)
}

// PATCH /api/encargados/:id/toggle
func ToggleEncargado(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	res, err := database.DB.Exec(
		"UPDATE encargados SET activo = NOT activo WHERE id = $1", id,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "encargado no encontrado"})
	}

	var activo bool
	database.DB.QueryRow("SELECT activo FROM encargados WHERE id = $1", id).Scan(&activo)
	return c.JSON(fiber.Map{"id": id, "activo": activo})
}
