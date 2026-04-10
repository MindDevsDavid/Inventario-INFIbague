package handlers

import (
	"database/sql"
	"inventario/backend/internal/database"
	"inventario/backend/internal/models"
	"log"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// GET /api/me — perfil del usuario autenticado con datos de encargado
func GetMe(c *fiber.Ctx) error {
	claims := c.Locals("claims").(jwt.MapClaims)
	username := claims["sub"].(string)

	var u models.User
	var encID sql.NullInt64
	err := database.DB.QueryRow(`
		SELECT u.id, u.username, u.rol, u.activo,
		       COALESCE(e.nombre, ''), COALESCE(e.cargo, ''), COALESCE(e.email, ''),
		       e.id
		FROM users u
		LEFT JOIN encargados e ON e.user_id = u.id
		WHERE u.username = $1
	`, username).Scan(&u.ID, &u.Username, &u.Rol, &u.Activo,
		&u.Nombre, &u.Cargo, &u.Email, &encID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "usuario no encontrado"})
	}
	if encID.Valid {
		id := int(encID.Int64)
		u.EncargadoID = &id
	}
	return c.JSON(u)
}

// GET /api/me/assets — activos de la oficina del usuario.
// Admin/operador ven todos; usuario ve los de su oficina (cargo del encargado vinculado).
func GetMyAssets(c *fiber.Ctx) error {
	claims := c.Locals("claims").(jwt.MapClaims)
	username := claims["sub"].(string)
	role, _ := claims["role"].(string)

	// Admin y operador: todos los activos
	if role == "admin" || role == "operador" {
		rows, err := database.DB.Query(`
			SELECT i.id, i.name, i.category, i.quantity, i.location, i.details,
			       i.encargado_id, COALESCE(e.nombre, '')
			FROM items i
			LEFT JOIN encargados e ON e.id = i.encargado_id
			ORDER BY i.name
		`)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		defer rows.Close()
		list := []models.Item{}
		for rows.Next() {
			item, err := scanItem(rows)
			if err == nil {
				list = append(list, item)
			}
		}
		return c.JSON(list)
	}

	// Usuario: filtrar por su oficina (cargo del encargado vinculado)
	var encargadoID sql.NullInt64
	var cargo string
	err := database.DB.QueryRow(`
		SELECT e.id, COALESCE(e.cargo, '')
		FROM users u
		LEFT JOIN encargados e ON e.user_id = u.id
		WHERE u.username = $1
	`, username).Scan(&encargadoID, &cargo)

	log.Printf("[me/assets] user=%s role=%s scanErr=%v encargadoID=%+v cargo=%q", username, role, err, encargadoID, cargo)

	// Sin encargado o sin oficina: no puede ver activos
	if !encargadoID.Valid || cargo == "" {
		return c.JSON([]models.Item{})
	}

	rows, err := database.DB.Query(`
		SELECT DISTINCT i.id, i.name, i.category, i.quantity, i.location, i.details,
		       i.encargado_id, COALESCE(e.nombre, '')
		FROM items i
		LEFT JOIN encargados e ON e.id = i.encargado_id
		WHERE e.cargo = $1
		ORDER BY i.name
	`, cargo)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	list := []models.Item{}
	for rows.Next() {
		item, err := scanItem(rows)
		if err == nil {
			list = append(list, item)
		}
	}
	return c.JSON(list)
}

const ticketSelect = `
	SELECT t.id, t.titulo, t.tipo_incidencia, t.descripcion, t.urgencia, t.estado,
	       t.item_id, COALESCE(i.name, ''),
	       t.user_id, COALESCE(ue.nombre, u.username),
	       t.tecnico_id, COALESCE(te.nombre, tu.username, ''),
	       t.notas, t.created_at, t.updated_at
	FROM tickets t
	LEFT JOIN items i ON i.id = t.item_id
	LEFT JOIN users u ON u.id = t.user_id
	LEFT JOIN encargados ue ON ue.user_id = u.id
	LEFT JOIN users tu ON tu.id = t.tecnico_id
	LEFT JOIN encargados te ON te.user_id = tu.id`

func scanTicket(row interface{ Scan(...any) error }) (models.Ticket, error) {
	var t models.Ticket
	var itemID sql.NullInt64
	var tecnicoID sql.NullInt64
	err := row.Scan(
		&t.ID, &t.Titulo, &t.TipoIncidencia, &t.Descripcion, &t.Urgencia, &t.Estado,
		&itemID, &t.ItemName,
		&t.UserID, &t.UserNombre,
		&tecnicoID, &t.TecnicoNombre,
		&t.Notas, &t.CreatedAt, &t.UpdatedAt,
	)
	if err == nil {
		if itemID.Valid {
			id := int(itemID.Int64)
			t.ItemID = &id
		}
		if tecnicoID.Valid {
			id := int(tecnicoID.Int64)
			t.TecnicoID = &id
		}
	}
	return t, err
}

// GET /api/tickets — usuario ve los suyos, operador/admin ve todos
func GetTickets(c *fiber.Ctx) error {
	claims := c.Locals("claims").(jwt.MapClaims)
	username := claims["sub"].(string)
	role, _ := claims["role"].(string)

	var rows *sql.Rows
	var err error

	if role == "usuario" {
		rows, err = database.DB.Query(
			ticketSelect+` WHERE u.username = $1 ORDER BY t.created_at DESC`,
			username,
		)
	} else {
		rows, err = database.DB.Query(ticketSelect + ` ORDER BY t.created_at DESC`)
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	list := []models.Ticket{}
	for rows.Next() {
		t, err := scanTicket(rows)
		if err != nil {
			continue
		}
		list = append(list, t)
	}
	return c.JSON(list)
}

// POST /api/tickets
func CreateTicket(c *fiber.Ctx) error {
	claims := c.Locals("claims").(jwt.MapClaims)
	username := claims["sub"].(string)

	var body struct {
		Titulo         string `json:"titulo"`
		TipoIncidencia string `json:"tipo_incidencia"`
		Descripcion    string `json:"descripcion"`
		Urgencia       string `json:"urgencia"`
		ItemID         *int   `json:"item_id"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	body.Titulo = strings.TrimSpace(body.Titulo)
	body.Descripcion = strings.TrimSpace(body.Descripcion)
	if body.Titulo == "" || body.TipoIncidencia == "" {
		return c.Status(400).JSON(fiber.Map{"error": "título y tipo de incidencia son obligatorios"})
	}

	validUrgencias := map[string]bool{"Baja": true, "Media": true, "Alta": true, "Crítica": true}
	if !validUrgencias[body.Urgencia] {
		body.Urgencia = "Media"
	}

	var userID int
	if err := database.DB.QueryRow("SELECT id FROM users WHERE username = $1", username).Scan(&userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "usuario no encontrado"})
	}

	var ticketID int
	err := database.DB.QueryRow(`
		INSERT INTO tickets (titulo, tipo_incidencia, descripcion, urgencia, user_id, item_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, body.Titulo, body.TipoIncidencia, body.Descripcion, body.Urgencia, userID, body.ItemID).Scan(&ticketID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var t models.Ticket
	row := database.DB.QueryRow(ticketSelect+` WHERE t.id = $1`, ticketID)
	t, err = scanTicket(row)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(t)
}

// PUT /api/tickets/:id — operador/admin actualiza estado, urgencia, técnico, notas
func UpdateTicket(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	var body struct {
		Estado    string `json:"estado"`
		Urgencia  string `json:"urgencia"`
		TecnicoID *int   `json:"tecnico_id"`
		Notas     string `json:"notas"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	validEstados := map[string]bool{"Abierto": true, "En Proceso": true, "Resuelto": true, "Cerrado": true}
	if !validEstados[body.Estado] {
		return c.Status(400).JSON(fiber.Map{"error": "estado inválido"})
	}
	validUrgencias := map[string]bool{"Baja": true, "Media": true, "Alta": true, "Crítica": true}
	if !validUrgencias[body.Urgencia] {
		return c.Status(400).JSON(fiber.Map{"error": "urgencia inválida"})
	}

	res, err := database.DB.Exec(`
		UPDATE tickets
		SET estado=$1, urgencia=$2, tecnico_id=$3, notas=$4, updated_at=NOW()
		WHERE id=$5
	`, body.Estado, body.Urgencia, body.TecnicoID, strings.TrimSpace(body.Notas), id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "ticket no encontrado"})
	}

	var t models.Ticket
	row := database.DB.QueryRow(ticketSelect+` WHERE t.id = $1`, id)
	t, err = scanTicket(row)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(t)
}
