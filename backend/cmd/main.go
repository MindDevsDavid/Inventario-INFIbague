package main

import (
	"inventario/backend/internal/config"
	"inventario/backend/internal/database"
	"inventario/backend/internal/handlers"
	"inventario/backend/internal/middleware"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	appCors "github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	config.Load()

	if err := database.Init(); err != nil {
		log.Fatal("Error iniciando base de datos:", err)
	}

	app := fiber.New(fiber.Config{
		BodyLimit: 1 * 1024 * 1024, // 1 MB máximo por request
	})

	app.Use(helmet.New())
	app.Use(logger.New())
	app.Use(appCors.New(appCors.Config{
		AllowOrigins: config.CORSOrigin,
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Content-Type,Authorization",
	}))

	api := app.Group("/api")

	// Login con rate limit
	api.Post("/auth/login", limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{"error": "demasiados intentos, espera un momento"})
		},
	}), handlers.Login)

	// Rutas protegidas por JWT
	protected := api.Group("", middleware.Protected())

	protected.Get("/me", handlers.GetMe)
	protected.Get("/me/assets", handlers.GetMyAssets)

	protected.Get("/tickets", handlers.GetTickets)
	protected.Get("/tickets/:id", handlers.GetTicket)
	protected.Post("/tickets", handlers.CreateTicket)
	protected.Put("/tickets/:id", middleware.AdminOrTecnico(), handlers.UpdateTicket)
	protected.Get("/tickets/:id/history", handlers.GetTicketHistory)
	protected.Post("/tickets/:id/notes", handlers.AddTicketNote)
	protected.Get("/tecnicos", handlers.GetTecnicos)

	protected.Get("/dashboard", handlers.GetDashboard)
	protected.Get("/items", handlers.GetItems)
	protected.Get("/items/:id", handlers.GetItem)
	protected.Post("/items", middleware.AdminOrTecnico(), handlers.CreateItem)
	protected.Put("/items/:id", middleware.AdminOrTecnico(), handlers.UpdateItem)
	protected.Delete("/items/:id", middleware.AdminOnly(), handlers.DeleteItem)

	protected.Get("/encargados", handlers.GetEncargados)
	protected.Put("/encargados/:id", middleware.AdminOrTecnico(), handlers.UpdateEncargado)
	protected.Patch("/encargados/:id/toggle", middleware.AdminOrTecnico(), handlers.ToggleEncargado)

	// Gestión de usuarios — solo admins
	admin := protected.Group("", middleware.AdminOnly())
	admin.Get("/users", handlers.GetUsers)
	admin.Post("/users", handlers.CreateUser)
	admin.Put("/users/:id", handlers.UpdateUser)
	admin.Patch("/users/:id/toggle", handlers.ToggleUser)

	log.Println("Backend corriendo en http://localhost:8080")
	log.Fatal(app.Listen(":8080"))
}
