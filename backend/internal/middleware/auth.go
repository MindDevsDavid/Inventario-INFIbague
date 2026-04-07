package middleware

import (
	"inventario/backend/internal/config"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gofiber/fiber/v2"
)

// Protected valida el JWT y guarda los claims en el contexto.
func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(401).JSON(fiber.Map{"error": "no autorizado"})
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(config.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "token inválido o expirado"})
		}

		claims, _ := token.Claims.(jwt.MapClaims)
		c.Locals("claims", claims)
		return c.Next()
	}
}

// AdminOnly permite el acceso solo a usuarios con rol "admin".
func AdminOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims, ok := c.Locals("claims").(jwt.MapClaims)
		if !ok || claims["role"] != "admin" {
			return c.Status(403).JSON(fiber.Map{"error": "acceso denegado — se requiere rol admin"})
		}
		return c.Next()
	}
}
