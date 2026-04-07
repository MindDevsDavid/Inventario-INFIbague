package main

import (
	"inventario/backend/internal/database"
	"inventario/backend/internal/handlers"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	if err := database.Init(); err != nil {
		log.Fatal("Error iniciando base de datos:", err)
	}

	app := fiber.New()

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Content-Type",
	}))

	api := app.Group("/api")
	api.Get("/dashboard", handlers.GetDashboard)
	api.Get("/items", handlers.GetItems)
	api.Get("/items/:id", handlers.GetItem)
	api.Post("/items", handlers.CreateItem)
	api.Put("/items/:id", handlers.UpdateItem)
	api.Delete("/items/:id", handlers.DeleteItem)

	api.Get("/encargados", handlers.GetEncargados)
	api.Post("/encargados", handlers.CreateEncargado)
	api.Put("/encargados/:id", handlers.UpdateEncargado)
	api.Patch("/encargados/:id/toggle", handlers.ToggleEncargado)

	log.Println("Backend corriendo en http://localhost:8080")
	log.Fatal(app.Listen(":8080"))
}
