package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go-gin/cmd/server"
	_ "go-gin/docs"
)

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"timestamp": log.Now().UnixMilli(),
		})
	})

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	server.SetupRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}

	log.Printf("🚀 Go + Gin server running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
