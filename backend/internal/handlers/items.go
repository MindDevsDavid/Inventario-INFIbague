package handlers

import (
	"database/sql"
	"inventario/backend/internal/database"
	"inventario/backend/internal/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

const selectItems = `
	SELECT i.id, i.name, i.category, i.quantity, i.location, i.details,
	       i.encargado_id, COALESCE(e.nombre, '') as encargado
	FROM items i
	LEFT JOIN encargados e ON e.id = i.encargado_id`

func scanItem(row interface{ Scan(...any) error }) (models.Item, error) {
	var item models.Item
	var details string
	var encargadoID sql.NullInt64
	err := row.Scan(&item.ID, &item.Name, &item.Category, &item.Quantity,
		&item.Location, &details, &encargadoID, &item.Encargado)
	if err == nil {
		item.DetailsFromJSON(details)
		if encargadoID.Valid {
			id := int(encargadoID.Int64)
			item.EncargadoID = &id
		}
	}
	return item, err
}

// GET /api/items?category=xxx
func GetItems(c *fiber.Ctx) error {
	category := c.Query("category")
	query := selectItems
	args := []any{}
	if category != "" {
		query += " WHERE i.category = $1"
		args = append(args, category)
	}
	query += " ORDER BY i.id ASC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	items := []models.Item{}
	for rows.Next() {
		item, err := scanItem(rows)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		items = append(items, item)
	}
	return c.JSON(items)
}

// GET /api/items/:id
func GetItem(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}
	row := database.DB.QueryRow(selectItems+" WHERE i.id = $1", id)
	item, err := scanItem(row)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "item no encontrado"})
	}
	return c.JSON(item)
}

// POST /api/items
func CreateItem(c *fiber.Ctx) error {
	var item models.Item
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cuerpo de solicitud inválido"})
	}
	if item.Name == "" || item.Category == "" || item.Location == "" {
		return c.Status(400).JSON(fiber.Map{"error": "nombre, categoría y ubicación son obligatorios"})
	}

	var encargadoID interface{} = nil
	if item.EncargadoID != nil {
		encargadoID = *item.EncargadoID
	}

	err := database.DB.QueryRow(
		`INSERT INTO items (name, category, quantity, location, details, encargado_id)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		item.Name, item.Category, item.Quantity, item.Location, item.DetailsToJSON(), encargadoID,
	).Scan(&item.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(item)
}

// PUT /api/items/:id
func UpdateItem(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}
	var item models.Item
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cuerpo de solicitud inválido"})
	}
	if item.Name == "" || item.Category == "" || item.Location == "" {
		return c.Status(400).JSON(fiber.Map{"error": "nombre, categoría y ubicación son obligatorios"})
	}

	var encargadoID interface{} = nil
	if item.EncargadoID != nil {
		encargadoID = *item.EncargadoID
	}

	res, err := database.DB.Exec(
		`UPDATE items SET name=$1, category=$2, quantity=$3, location=$4, details=$5, encargado_id=$6
		 WHERE id=$7`,
		item.Name, item.Category, item.Quantity, item.Location, item.DetailsToJSON(), encargadoID, id,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "item no encontrado"})
	}
	item.ID = id
	return c.JSON(item)
}

// DELETE /api/items/:id
func DeleteItem(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}
	res, err := database.DB.Exec("DELETE FROM items WHERE id = $1", id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "item no encontrado"})
	}
	return c.SendStatus(204)
}

// GET /api/dashboard
func GetDashboard(c *fiber.Ctx) error {
	rows, err := database.DB.Query(
		"SELECT category, COUNT(*), SUM(quantity) FROM items GROUP BY category",
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	summary := map[string]fiber.Map{}
	for rows.Next() {
		var category string
		var count, total int
		if err := rows.Scan(&category, &count, &total); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		summary[category] = fiber.Map{"items": count, "total_quantity": total}
	}
	return c.JSON(summary)
}
