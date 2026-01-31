package models

import (
	"gorm.io/gorm"
	"time"
)

type Field struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Address     string         `json:"address"`
	PricePerHour float64       `json:"price_per_hour"`
	Facilities  string         `json:"facilities"` // Comma separated or JSON
	Images      string         `json:"images"`     // Comma separated URLs or JSON
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
