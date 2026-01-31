package models

import (
	"gorm.io/gorm"
	"time"
)

type PaymentStatus string

const (
	PaymentPending PaymentStatus = "pending"
	PaymentSuccess PaymentStatus = "success"
	PaymentFailed  PaymentStatus = "failed"
)

type Payment struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	BookingID     uint           `json:"booking_id"`
	Amount        float64        `json:"amount"`
	Method        string         `json:"method"` // e.g., "qris"
	TransactionID string         `json:"transaction_id"`
	QrCode        string         `json:"qr_code"` // URL or payload
	Status        PaymentStatus  `gorm:"default:'pending'" json:"status"`
	PaidAt        *time.Time     `json:"paid_at"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}
