package main

import (
	"lapangan/internal/config"
	"lapangan/internal/routes"
	"lapangan/internal/utils"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}

	config.ConnectDB()
	
	// Seed initial data
	utils.SeedData()

	r := routes.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
