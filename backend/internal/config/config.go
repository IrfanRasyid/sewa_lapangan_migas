package config

import (
	"fmt"
	"lapangan/internal/models"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dbType := os.Getenv("DB_TYPE")
	var err error

	if dbType == "postgres" {
		var dsn string
		if dbUrl := os.Getenv("DATABASE_URL"); dbUrl != "" {
			dsn = dbUrl
			// Fix for Supabase: Ensure sslmode=require is present if not already
			if !strings.Contains(dsn, "sslmode=") {
				if strings.Contains(dsn, "?") {
					dsn += "&sslmode=require"
				} else {
					dsn += "?sslmode=require"
				}
			}
		} else {
			dsn = fmt.Sprintf(
				"host=%s user=%s password=%s dbname=%s port=%s sslmode=require TimeZone=Asia/Jakarta",
				os.Getenv("DB_HOST"),
				os.Getenv("DB_USER"),
				os.Getenv("DB_PASSWORD"),
				os.Getenv("DB_NAME"),
				os.Getenv("DB_PORT"),
			)
		}
		fmt.Println("Connecting to Postgres...")
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	} else {
		// Default to SQLite
		fmt.Println("Using SQLite database...")
		// Ensure directory exists or use a temp path if permission denied in /app
		DB, err = gorm.Open(sqlite.Open("lapangan.db"), &gorm.Config{})
	}

	if err != nil {
		fmt.Printf("Error connecting to database: %v\n", err)
		panic("Failed to connect to database!")
	}

	fmt.Println("Database connected!")
	MigrateDB()
}

func MigrateDB() {
	err := DB.AutoMigrate(&models.User{}, &models.Field{}, &models.Booking{}, &models.Payment{})
	if err != nil {
		fmt.Printf("Error migrating database: %v\n", err)
	} else {
		fmt.Println("Database migrated!")
	}
}
