package config

import (
	"fmt"
	"lapangan/internal/models"
	"os"

	"gorm.io/driver/postgres"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dbType := os.Getenv("DB_TYPE")
	var err error

	if dbType == "postgres" {
		dsn := fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
			os.Getenv("DB_HOST"),
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
			os.Getenv("DB_PORT"),
		)
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	} else {
		// Default to SQLite
		fmt.Println("Using SQLite database...")
		DB, err = gorm.Open(sqlite.Open("lapangan.db"), &gorm.Config{})
	}

	if err != nil {
		panic("Failed to connect to database!")
	}

	fmt.Println("Database connected!")
	MigrateDB()
}

func MigrateDB() {
	DB.AutoMigrate(&models.User{}, &models.Field{}, &models.Booking{}, &models.Payment{})
	fmt.Println("Database migrated!")
}
