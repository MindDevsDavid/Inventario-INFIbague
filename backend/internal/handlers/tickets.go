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

// ---------- helpers ----------

var validEstados = map[string]bool{
	"Abierto": true, "En Proceso": true,
	"Esperando respuesta": true, "Esperando repuesto": true,
	"Resuelto": true, "Cerrado": true,
}
var validUrgencias = map[string]bool{
	"Baja": true, "Media": true, "Alta": true, "Crítica": true,
}

func getUserIDFromClaims(c *fiber.Ctx) (int, string, string) {
	claims := c.Locals("claims").(jwt.MapClaims)
	username := claims["sub"].(string)
	role, _ := claims["role"].(string)
	var userID int
	database.DB.QueryRow("SELECT id FROM users WHERE username = $1", username).Scan(&userID)
	return userID, username, role
}

func logTicketChange(ticketID, userID int, tipo, anterior, nuevo string) {
	database.DB.Exec(
		`INSERT INTO ticket_history (ticket_id, user_id, tipo, valor_anterior, valor_nuevo)
		 VALUES ($1, $2, $3, $4, $5)`,
		ticketID, userID, tipo, anterior, nuevo,
	)
}

func logTicketNote(ticketID, userID int, tipo, contenido string) {
	database.DB.Exec(
		`INSERT INTO ticket_history (ticket_id, user_id, tipo, contenido)
		 VALUES ($1, $2, $3, $4)`,
		ticketID, userID, tipo, contenido,
	)
}

// ---------- /api/me ----------

// GET /api/me
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
	`, username).Scan(&u.ID, &u.Username, &u.Rol, &u.Activo, &u.Nombre, &u.Cargo, &u.Email, &encID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "usuario no encontrado"})
	}
	if encID.Valid {
		id := int(encID.Int64)
		u.EncargadoID = &id
	}
	return c.JSON(u)
}

// ---------- /api/me/assets ----------

// GET /api/me/assets
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

	// Usuario: filtrar por su oficina
	var encargadoID sql.NullInt64
	var cargo string
	err := database.DB.QueryRow(`
		SELECT e.id, COALESCE(e.cargo, '')
		FROM users u
		LEFT JOIN encargados e ON e.user_id = u.id
		WHERE u.username = $1
	`, username).Scan(&encargadoID, &cargo)

	log.Printf("[me/assets] user=%s role=%s scanErr=%v encargadoID=%+v cargo=%q", username, role, err, encargadoID, cargo)

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

// ---------- /api/tecnicos ----------

// GET /api/tecnicos — lista de operadores y admins para asignación
func GetTecnicos(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT u.id, u.username, COALESCE(e.nombre, u.username)
		FROM users u
		LEFT JOIN encargados e ON e.user_id = u.id
		WHERE u.rol IN ('admin','operador') AND u.activo = true
		ORDER BY COALESCE(e.nombre, u.username)
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type tecnico struct {
		ID     int    `json:"id"`
		User   string `json:"username"`
		Nombre string `json:"nombre"`
	}
	list := []tecnico{}
	for rows.Next() {
		var t tecnico
		if rows.Scan(&t.ID, &t.User, &t.Nombre) == nil {
			list = append(list, t)
		}
	}
	return c.JSON(list)
}

// ---------- tickets CRUD ----------

const ticketSelect = `
	SELECT t.id, t.titulo, t.tipo_incidencia, t.descripcion, t.urgencia, t.estado,
	       t.item_id, COALESCE(i.name, ''), COALESCE(i.category, ''),
	       t.user_id, COALESCE(ue.nombre, u.username),
	       t.tecnico_id, COALESCE(te.nombre, tu.username, ''),
	       t.created_at, t.updated_at
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
		&itemID, &t.ItemName, &t.ItemCategory,
		&t.UserID, &t.UserNombre,
		&tecnicoID, &t.TecnicoNombre,
		&t.CreatedAt, &t.UpdatedAt,
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

// GET /api/tickets
func GetTickets(c *fiber.Ctx) error {
	_, username, role := getUserIDFromClaims(c)

	var rows *sql.Rows
	var err error

	if role == "usuario" {
		rows, err = database.DB.Query(
			ticketSelect+` WHERE u.username = $1 ORDER BY t.created_at DESC`, username,
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
		if err == nil {
			list = append(list, t)
		}
	}
	return c.JSON(list)
}

// GET /api/tickets/:id
func GetTicket(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	userID, _, role := getUserIDFromClaims(c)

	row := database.DB.QueryRow(ticketSelect+` WHERE t.id = $1`, id)
	t, err := scanTicket(row)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ticket no encontrado"})
	}

	// Usuario solo puede ver su propio ticket
	if role == "usuario" && t.UserID != userID {
		return c.Status(403).JSON(fiber.Map{"error": "acceso denegado"})
	}
	return c.JSON(t)
}

// POST /api/tickets
func CreateTicket(c *fiber.Ctx) error {
	userID, _, _ := getUserIDFromClaims(c)

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
	if !validUrgencias[body.Urgencia] {
		body.Urgencia = "Media"
	}

	var ticketID int
	err := database.DB.QueryRow(`
		INSERT INTO tickets (titulo, tipo_incidencia, descripcion, urgencia, user_id, item_id)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
	`, body.Titulo, body.TipoIncidencia, body.Descripcion, body.Urgencia, userID, body.ItemID).Scan(&ticketID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Log creación en historial
	logTicketNote(ticketID, userID, "creacion", "Ticket creado")

	row := database.DB.QueryRow(ticketSelect+` WHERE t.id = $1`, ticketID)
	t, _ := scanTicket(row)
	return c.Status(201).JSON(t)
}

// PUT /api/tickets/:id — operador/admin actualiza estado, urgencia, técnico
func UpdateTicket(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	userID, _, _ := getUserIDFromClaims(c)

	var body struct {
		Estado    string `json:"estado"`
		Urgencia  string `json:"urgencia"`
		TecnicoID *int   `json:"tecnico_id"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	if !validEstados[body.Estado] {
		return c.Status(400).JSON(fiber.Map{"error": "estado inválido"})
	}
	if !validUrgencias[body.Urgencia] {
		return c.Status(400).JSON(fiber.Map{"error": "urgencia inválida"})
	}

	// Obtener estado anterior para registrar cambios
	var oldEstado, oldUrgencia string
	var oldTecnicoID sql.NullInt64
	database.DB.QueryRow(
		"SELECT estado, urgencia, tecnico_id FROM tickets WHERE id=$1", id,
	).Scan(&oldEstado, &oldUrgencia, &oldTecnicoID)

	res, err := database.DB.Exec(`
		UPDATE tickets SET estado=$1, urgencia=$2, tecnico_id=$3, updated_at=NOW()
		WHERE id=$4
	`, body.Estado, body.Urgencia, body.TecnicoID, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "ticket no encontrado"})
	}

	// Registrar cambios en historial
	if oldEstado != body.Estado {
		logTicketChange(id, userID, "cambio_estado", oldEstado, body.Estado)
	}
	if oldUrgencia != body.Urgencia {
		logTicketChange(id, userID, "cambio_urgencia", oldUrgencia, body.Urgencia)
	}

	// Detectar cambio de técnico
	oldTecID := 0
	if oldTecnicoID.Valid {
		oldTecID = int(oldTecnicoID.Int64)
	}
	newTecID := 0
	if body.TecnicoID != nil {
		newTecID = *body.TecnicoID
	}
	if oldTecID != newTecID {
		oldName, newName := "Sin asignar", "Sin asignar"
		if oldTecID > 0 {
			database.DB.QueryRow(
				"SELECT COALESCE(e.nombre, u.username) FROM users u LEFT JOIN encargados e ON e.user_id=u.id WHERE u.id=$1", oldTecID,
			).Scan(&oldName)
		}
		if newTecID > 0 {
			database.DB.QueryRow(
				"SELECT COALESCE(e.nombre, u.username) FROM users u LEFT JOIN encargados e ON e.user_id=u.id WHERE u.id=$1", newTecID,
			).Scan(&newName)
		}
		logTicketChange(id, userID, "asignacion", oldName, newName)
	}

	row := database.DB.QueryRow(ticketSelect+` WHERE t.id = $1`, id)
	t, _ := scanTicket(row)
	return c.JSON(t)
}

// ---------- historial y notas ----------

// GET /api/tickets/:id/history
func GetTicketHistory(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	userID, _, role := getUserIDFromClaims(c)

	// Usuario solo puede ver historial de su propio ticket
	if role == "usuario" {
		var ticketOwner int
		database.DB.QueryRow("SELECT user_id FROM tickets WHERE id=$1", id).Scan(&ticketOwner)
		if ticketOwner != userID {
			return c.Status(403).JSON(fiber.Map{"error": "acceso denegado"})
		}
	}

	query := `
		SELECT h.id, h.ticket_id, h.user_id,
		       COALESCE(e.nombre, u.username),
		       h.tipo, h.contenido, h.valor_anterior, h.valor_nuevo, h.created_at
		FROM ticket_history h
		LEFT JOIN users u ON u.id = h.user_id
		LEFT JOIN encargados e ON e.user_id = u.id
		WHERE h.ticket_id = $1`

	// Usuario no ve notas privadas
	if role == "usuario" {
		query += ` AND h.tipo != 'nota_privada'`
	}
	query += ` ORDER BY h.created_at ASC`

	rows, err := database.DB.Query(query, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	list := []models.TicketHistory{}
	for rows.Next() {
		var h models.TicketHistory
		if rows.Scan(&h.ID, &h.TicketID, &h.UserID, &h.UserNombre,
			&h.Tipo, &h.Contenido, &h.ValorAnterior, &h.ValorNuevo, &h.CreatedAt) == nil {
			list = append(list, h)
		}
	}
	return c.JSON(list)
}

// POST /api/tickets/:id/notes
func AddTicketNote(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id inválido"})
	}

	userID, _, role := getUserIDFromClaims(c)

	var body struct {
		Tipo      string `json:"tipo"`      // nota_privada | comunicacion
		Contenido string `json:"contenido"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	body.Contenido = strings.TrimSpace(body.Contenido)
	if body.Contenido == "" {
		return c.Status(400).JSON(fiber.Map{"error": "el contenido es obligatorio"})
	}

	// Usuario solo puede agregar comunicaciones (no notas privadas)
	if role == "usuario" {
		body.Tipo = "comunicacion"
		// Verificar que sea su ticket
		var ticketOwner int
		database.DB.QueryRow("SELECT user_id FROM tickets WHERE id=$1", id).Scan(&ticketOwner)
		if ticketOwner != userID {
			return c.Status(403).JSON(fiber.Map{"error": "acceso denegado"})
		}
	}

	if body.Tipo != "nota_privada" && body.Tipo != "comunicacion" {
		return c.Status(400).JSON(fiber.Map{"error": "tipo inválido"})
	}

	var hID int
	err = database.DB.QueryRow(`
		INSERT INTO ticket_history (ticket_id, user_id, tipo, contenido)
		VALUES ($1, $2, $3, $4) RETURNING id
	`, id, userID, body.Tipo, body.Contenido).Scan(&hID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Actualizar updated_at del ticket
	database.DB.Exec("UPDATE tickets SET updated_at=NOW() WHERE id=$1", id)

	var h models.TicketHistory
	database.DB.QueryRow(`
		SELECT h.id, h.ticket_id, h.user_id,
		       COALESCE(e.nombre, u.username),
		       h.tipo, h.contenido, h.valor_anterior, h.valor_nuevo, h.created_at
		FROM ticket_history h
		LEFT JOIN users u ON u.id = h.user_id
		LEFT JOIN encargados e ON e.user_id = u.id
		WHERE h.id = $1
	`, hID).Scan(&h.ID, &h.TicketID, &h.UserID, &h.UserNombre,
		&h.Tipo, &h.Contenido, &h.ValorAnterior, &h.ValorNuevo, &h.CreatedAt)

	return c.Status(201).JSON(h)
}
