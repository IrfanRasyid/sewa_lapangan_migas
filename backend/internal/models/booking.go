package models

import (
	"gorm.io/gorm"
	"time"
)

type BookingStatus string

const (
	BookingPending  BookingStatus = "pending"
	BookingPaid     BookingStatus = "paid"
	BookingExpired  BookingStatus = "expired"
	BookingCanceled BookingStatus = "canceled"
)

type Booking struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	UserID     uint           `json:"user_id"`
	User       User           `gorm:"foreignKey:UserID" json:"user"`
	FieldID    uint           `json:"field_id"`
	Field      Field          `gorm:"foreignKey:FieldID" json:"field"`
	StartTime  time.Time      `json:"start_time"`
	EndTime    time.Time      `json:"end_time"`
	TotalPrice float64        `json:"total_price"`
	Status       BookingStatus  `gorm:"default:'pending'" json:"status"`
	PaymentProof string         `json:"payment_proof"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	Payment    Payment        `json:"payment,omitempty"`
}
