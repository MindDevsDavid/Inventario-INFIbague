package handlers

import (
	"inventario/backend/internal/config"
	"inventario/backend/internal/database"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// POST /api/auth/login
func Login(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "datos inválidos"})
	}

	var id int
	var passwordHash, rol string
	var activo bool
	err := database.DB.QueryRow(
		"SELECT id, password_hash, rol, activo FROM users WHERE username = $1",
		body.Username,
	).Scan(&id, &passwordHash, &rol, &activo)

	// Siempre verificamos el bcrypt para prevenir timing attacks
	hashToCheck := passwordHash
	if err != nil || !activo {
		hashToCheck = "$2a$10$invalidhashpaddingtomakeitconstanttime1234567890abcdef"
	}
	bcryptErr := bcrypt.CompareHashAndPassword([]byte(hashToCheck), []byte(body.Password))

	if err != nil || !activo || bcryptErr != nil {
		return c.Status(401).JSON(fiber.Map{"error": "usuario o contraseña incorrectos"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  body.Username,
		"role": rol,
		"exp":  time.Now().Add(8 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	})

	tokenStr, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "error generando token"})
	}

	return c.JSON(fiber.Map{"token": tokenStr, "role": rol, "username": body.Username})
}
