package main

import (
	"lapangan/internal/config"
	"lapangan/internal/routes"
	"lapangan/internal/utils"
	"log"

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

	r.Run(":8080")
}
