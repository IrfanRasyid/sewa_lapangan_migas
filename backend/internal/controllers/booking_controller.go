package controllers

import (
	"lapangan/internal/config"
	"lapangan/internal/models"
	"net/http"
	"os"
	"path/filepath"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

func CreateBooking(c *gin.Context) {
	var input struct {
		FieldID   uint      `json:"field_id" binding:"required"`
		StartTime time.Time `json:"start_time" binding:"required"`
		EndTime   time.Time `json:"end_time" binding:"required"`
		IsMemberBooking bool `json:"is_member_booking"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get User ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Calculate duration
	duration := input.EndTime.Sub(input.StartTime).Hours()
	if duration <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time range"})
		return
	}

	// Fetch field to get price
	var field models.Field
	if err := config.DB.First(&field, input.FieldID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Field not found"})
		return
	}

	totalPrice := field.PricePerHour * duration
	if input.IsMemberBooking {
		// Member booking is for 4 weeks (4 sessions)
		totalPrice = totalPrice * 4
	}

	// Create bookings transaction
	tx := config.DB.Begin()

	// If member booking, create 4 bookings (one per week)
	sessions := 1
	if input.IsMemberBooking {
		sessions = 4
	}

	var firstBooking models.Booking

	for i := 0; i < sessions; i++ {
		sessionStart := input.StartTime.AddDate(0, 0, i*7)
		sessionEnd := input.EndTime.AddDate(0, 0, i*7)

		// Check overlap for each session
		var count int64
		tx.Model(&models.Booking{}).Where("field_id = ? AND status != ? AND start_time < ? AND end_time > ?", 
			input.FieldID, models.BookingCanceled, sessionEnd, sessionStart).Count(&count)
		
		if count > 0 {
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{
				"error": fmt.Sprintf("Gagal booking member: Jadwal pada tanggal %s sudah terisi", sessionStart.Format("02-01-2006")),
			})
			return
		}

		booking := models.Booking{
			UserID:     uint(userID.(float64)),
			FieldID:    input.FieldID,
			StartTime:  sessionStart,
			EndTime:    sessionEnd,
			TotalPrice: field.PricePerHour * duration, // Price per session stored in individual booking
			Status:     models.BookingPending,
		}

		if i == 0 {
			// First booking holds the full payment responsibility initially or logic can be adjusted
			// For simplicity, let's say each booking is individual but we return the first one as reference
			// Or we can group them. For now, let's just create individual bookings.
			// But the frontend expects one total price. Let's adjust.
			// If we want one payment for all, we might need a "Group ID" or similar.
			// Simplest approach: Create 4 independent bookings. The user pays for the first one? No, that's confusing.
			// Better approach: The response returns the first booking, but with the TOTAL price of all 4 sessions so the QRIS is generated for the full amount.
			// And we need to link them.
			
			// Let's store the TOTAL price in the first booking for payment purposes? 
			// Or just sum them up in frontend?
			// The user requirement implies a bulk booking.
			// Let's stick to creating 4 bookings. The first one will be returned to generate QRIS.
			// We will override the TotalPrice of the returned booking object to match the full amount just for the response, 
			// but save individual prices in DB to keep data consistent.
			booking.TotalPrice = totalPrice // HACK: Storing full price in first booking for simple payment flow? 
			// Wait, if we store full price in first booking, and normal price in others, it's weird.
			// Let's store individual prices in DB.
			booking.TotalPrice = field.PricePerHour * duration
		}

		if err := tx.Create(&booking).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
			return
		}

		if i == 0 {
			firstBooking = booking
			// Manually set TotalPrice for the response to include all sessions
			firstBooking.TotalPrice = totalPrice 
			// Update the first booking in DB to have the total price so payment verification matches?
			// Yes, let's make the first booking the "Parent" payment booking.
			// Ideally we should have a Payment table referencing multiple bookings, but that's a larger refactor.
			// Solution: Make the first booking carry the total cost. Subsequent bookings have 0 cost or marked as paid?
			// Let's set first booking price = total price. Others = 0 (paid by first).
			tx.Model(&booking).Update("total_price", totalPrice)
		} else {
			// Mark subsequent bookings as "linked" or just 0 price
			tx.Model(&booking).Update("total_price", 0)
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"data": firstBooking})
}

func GetMyBookings(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var bookings []models.Booking
	// Preload Field data so we can show field name
	if err := config.DB.Preload("Field").Where("user_id = ?", userID).Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": bookings})
}

// Public: Get bookings for a specific field (for schedule view)
func GetFieldBookings(c *gin.Context) {
	fieldID := c.Param("id")
	now := time.Now()
	monthLater := now.AddDate(0, 1, 0)
	var bookings []models.Booking
	if err := config.DB.Where("field_id = ? AND start_time BETWEEN ? AND ? AND status != ?", 
		fieldID, now, monthLater, models.BookingCanceled).Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var publicBookings []gin.H
	for _, b := range bookings {
		publicBookings = append(publicBookings, gin.H{
			"start_time": b.StartTime,
			"end_time":   b.EndTime,
			"status":     b.Status,
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": publicBookings})
}

// Admin only: Get all bookings
func GetAllBookings(c *gin.Context) {
	var bookings []models.Booking
	if err := config.DB.Preload("Field").Preload("User").Order("created_at desc").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": bookings})
}

// Admin only: Update booking status
func UpdateBookingStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var booking models.Booking
	if err := config.DB.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	booking.Status = models.BookingStatus(input.Status)
	if err := config.DB.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": booking})
}

func UploadPaymentProof(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var booking models.Booking
	if err := config.DB.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// Verify user owns the booking
	if booking.UserID != uint(userID.(float64)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access to booking"})
		return
	}

	file, err := c.FormFile("proof")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Create uploads directory if not exists (backend/uploads relative to execution)
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	filename := fmt.Sprintf("proof_%s_%d%s", id, time.Now().Unix(), filepath.Ext(file.Filename))
	filepath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Update booking with payment proof path (relative URL)
	proofURL := "/uploads/" + filename
	booking.PaymentProof = proofURL
	
	if err := config.DB.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment proof uploaded successfully", "data": booking})
}
