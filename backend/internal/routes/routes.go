package routes

import (
	"lapangan/internal/controllers"
	"lapangan/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", controllers.Register)
			auth.POST("/login", controllers.Login)
		}

		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware())
		{
			users.GET("/me", controllers.GetProfile)
			users.PUT("/me", controllers.UpdateProfile)
		}

		fields := api.Group("/fields")
		{
			fields.GET("/", controllers.GetFields)
			fields.GET("/:id", controllers.GetField)
			fields.GET("/:id/bookings", controllers.GetFieldBookings)
			fields.POST("/", middleware.AuthMiddleware(), controllers.CreateField)
		}

		bookings := api.Group("/bookings")
		bookings.Use(middleware.AuthMiddleware())
		{
			bookings.POST("/", controllers.CreateBooking)
			bookings.GET("/my", controllers.GetMyBookings)
			bookings.POST("/:id/payment-proof", controllers.UploadPaymentProof)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
		{
			admin.GET("/bookings", controllers.GetAllBookings)
			admin.PUT("/bookings/:id/status", controllers.UpdateBookingStatus)
		}
	}

	return r
}
