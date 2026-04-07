package server

import (
	"app/internal/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	usersHandler := handlers.NewUsersHandlers()
	ordersHandler := handlers.NewOrdersHandlers()

	api := r.Group("/api")
	{
		users := api.Group("/users")
		{
			users.POST("", usersHandler.CreateUser)
			users.GET("", usersHandler.GetUsers)
			users.GET("/:id", usersHandler.GetUser)
			users.PUT("/:id", usersHandler.UpdateUser)
			users.DELETE("/:id", usersHandler.DeleteUser)
			users.GET("/:id/orders", usersHandler.GetUserWithOrders)
			users.GET("/:id/stats", usersHandler.GetUserStats)
		}

		orders := api.Group("/orders")
		{
			orders.POST("", ordersHandler.CreateOrder)
			orders.GET("", ordersHandler.GetOrders)
			orders.GET("/aggregation", ordersHandler.GetAggregation)
			orders.GET("/:id", ordersHandler.GetOrder)
			orders.PUT("/:id", ordersHandler.UpdateOrder)
			orders.DELETE("/:id", ordersHandler.DeleteOrder)
		}
	}
}
