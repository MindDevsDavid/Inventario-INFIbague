package config

import (
	"log"
	"os"
)

var (
	JWTSecret     string
	AdminUsername string
	AdminPassword string
	CORSOrigin    string
)

func Load() {
	JWTSecret = os.Getenv("JWT_SECRET")
	if JWTSecret == "" {
		JWTSecret = "dev-secret-CHANGE-IN-PRODUCTION"
		log.Println("⚠️  JWT_SECRET no está configurado — usando valor inseguro de desarrollo")
	}

	AdminUsername = os.Getenv("ADMIN_USERNAME")
	if AdminUsername == "" {
		AdminUsername = "admin"
	}

	AdminPassword = os.Getenv("ADMIN_PASSWORD")
	if AdminPassword == "" {
		AdminPassword = "admin"
		log.Println("⚠️  ADMIN_PASSWORD no está configurado — usando contraseña por defecto")
	}

	CORSOrigin = os.Getenv("CORS_ORIGIN")
	if CORSOrigin == "" {
		CORSOrigin = "http://localhost:5173"
	}
}
