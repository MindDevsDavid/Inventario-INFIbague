package handlers

import (
	"inventario/backend/internal/database"
	"inventario/backend/internal/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func scanItem(row interface{ Scan(...any) error }) (models.Item, error) {
	var item models.Item
	var details string
	err := row.Scan(&item.ID, &item.Name, &item.Category, &item.Quantity, &item.Location, &details)
	if err == nil {
		item.DetailsFromJSON(details)
	}
	return item, err
}

// GET /api/items?category=xxx
func GetItems(c *fiber.Ctx) error {
	category := c.Query("category")

	query := "SELECT id, name, category, quantity, location, details FROM items"
	args := []any{}
	if category != "" {
		query += " WHERE category = ?"
		args = append(args, category)
	}
	query += " ORDER BY id ASC"

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

	row := database.DB.QueryRow(
		"SELECT id, name, category, quantity, location, details FROM items WHERE id = ?", id,
	)
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

	result, err := database.DB.Exec(
		"INSERT INTO items (name, category, quantity, location, details) VALUES (?, ?, ?, ?, ?)",
		item.Name, item.Category, item.Quantity, item.Location, item.DetailsToJSON(),
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	id, _ := result.LastInsertId()
	item.ID = int(id)
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

	res, err := database.DB.Exec(
		"UPDATE items SET name=?, category=?, quantity=?, location=?, details=? WHERE id=?",
		item.Name, item.Category, item.Quantity, item.Location, item.DetailsToJSON(), id,
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

	res, err := database.DB.Exec("DELETE FROM items WHERE id = ?", id)
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
