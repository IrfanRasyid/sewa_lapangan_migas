package controllers

import (
	"lapangan/internal/config"
	"lapangan/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetFields(c *gin.Context) {
	var fields []models.Field
	config.DB.Find(&fields)
	c.JSON(http.StatusOK, gin.H{"data": fields})
}

func GetField(c *gin.Context) {
	id := c.Param("id")
	var field models.Field
	if err := config.DB.First(&field, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Field not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": field})
}

func CreateField(c *gin.Context) {
	var input models.Field
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if result := config.DB.Create(&input); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": input})
}
