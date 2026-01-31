package utils

import (
	"lapangan/internal/config"
	"lapangan/internal/models"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func SeedData() {
	SeedFields()
	SeedUsers()
}

func SeedUsers() {
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Admin123!"), bcrypt.DefaultCost)

	var admin models.User
	// Check if admin exists
	if err := config.DB.Where("role = ?", models.RoleAdmin).First(&admin).Error; err != nil {
		// Create new admin
		newAdmin := models.User{
			Name:     "Admin User",
			Email:    "admin@lapangan.com",
			Password: string(hashedPassword),
			Role:     models.RoleAdmin,
		}
		if result := config.DB.Create(&newAdmin); result.Error != nil {
			log.Println("Failed to seed admin:", result.Error)
		} else {
			log.Println("Admin user seeded successfully!")
		}
	} else {
		// Update existing admin credentials to ensure they match expectations
		admin.Email = "admin@lapangan.com"
		admin.Password = string(hashedPassword)
		if result := config.DB.Save(&admin); result.Error != nil {
			log.Println("Failed to update admin:", result.Error)
		} else {
			log.Println("Admin user credentials updated successfully!")
		}
	}
}

func SeedFields() {
	var count int64
	config.DB.Model(&models.Field{}).Count(&count)

	if count > 0 {
		// Update existing field image and price if needed
		var field models.Field
		if err := config.DB.Where("name LIKE ?", "%Indoor Futsal%").First(&field).Error; err == nil {
			field.Name = "Lapangan Bulutangkis"
			field.Images = "/futsal-indoor.jpg"
			field.PricePerHour = 35000
			config.DB.Save(&field)
		}
		return // Already seeded
	}

	fields := []models.Field{
		{
			Name:         "Lapangan Bulutangkis",
			Description:  "Professional indoor badminton court with synthetic grass.",
			Address:      "Jl. Sudirman No. 123, Jakarta",
			PricePerHour: 35000,
			Facilities:   "WiFi, Locker, Shower, Parking",
			Images:       "/futsal-indoor.jpg",
		},
		{
			Name:         "Field B (Outdoor Mini Soccer)",
			Description:  "Spacious outdoor mini soccer field with high quality grass.",
			Address:      "Jl. Gatot Subroto No. 45, Jakarta",
			PricePerHour: 200000,
			Facilities:   "Parking, Canteen, Lighting",
			Images:       "https://placehold.co/600x400/3498db/ffffff?text=Mini+Soccer",
		},
		{
			Name:         "Field C (Badminton Hall)",
			Description:  "Standard badminton court with rubber flooring.",
			Address:      "Jl. Asia Afrika No. 88, Jakarta",
			PricePerHour: 80000,
			Facilities:   "Locker, AC, Equipment Rental",
			Images:       "https://placehold.co/600x400/e67e22/ffffff?text=Badminton",
		},
	}

	if result := config.DB.Create(&fields); result.Error != nil {
		log.Println("Failed to seed fields:", result.Error)
	} else {
		log.Println("Fields seeded successfully!")
	}
}
