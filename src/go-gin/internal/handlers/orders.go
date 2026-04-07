package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"app/internal/database"
	"app/internal/models"
	"github.com/gin-gonic/gin"
)

// OrdersHandlers handles order-related requests
type OrdersHandlers struct{}

func NewOrdersHandlers() *OrdersHandlers {
	return &OrdersHandlers{}
}

// CreateOrder - POST /api/orders
func (h *OrdersHandlers) CreateOrder(c *gin.Context) {
	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := "pending"
	if req.Status != nil {
		status = *req.Status
	}

	var order models.Order
	err := database.DB.QueryRow(
		"INSERT INTO orders (user_id, amount, status) VALUES ($1, $2, $3) RETURNING id, user_id, amount, status, created_at",
		req.UserID, req.Amount, status,
	).Scan(&order.ID, &order.UserID, &order.Amount, &order.Status, &order.CreatedAt)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusCreated, order)
}

// GetOrders - GET /api/orders
func (h *OrdersHandlers) GetOrders(c *gin.Context) {
	rows, err := database.DB.Query(
		"SELECT o.id, o.user_id, o.amount, o.status, o.created_at, u.name, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC",
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var orders []map[string]interface{}
	for rows.Next() {
		var order models.Order
		var userName, userEmail sql.NullString
		if err := rows.Scan(&order.ID, &order.UserID, &order.Amount, &order.Status, &order.CreatedAt, &userName, &userEmail); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		orderMap := map[string]interface{}{
			"id":         order.ID,
			"user_id":    order.UserID,
			"amount":     order.Amount,
			"status":     order.Status,
			"created_at": order.CreatedAt,
		}

		if userName.Valid {
			orderMap["user_name"] = userName.String
		}
		if userEmail.Valid {
			orderMap["user_email"] = userEmail.String
		}

		orders = append(orders, orderMap)
	}

	c.JSON(http.StatusOK, orders)
}

// GetAggregation - GET /api/orders/aggregation (COUNT, SUM, AVG)
func (h *OrdersHandlers) GetAggregation(c *gin.Context) {
	var stats struct {
		TotalOrders int     `json:"totalOrders"`
		TotalAmount float64 `json:"totalAmount"`
		AvgAmount   float64 `json:"avgAmount"`
	}

	database.DB.QueryRow(
		"SELECT COUNT(*), COALESCE(SUM(amount), 0), COALESCE(AVG(amount), 0) FROM orders",
	).Scan(&stats.TotalOrders, &stats.TotalAmount, &stats.AvgAmount)

	c.JSON(http.StatusOK, stats)
}

// GetOrder - GET /api/orders/:id
func (h *OrdersHandlers) GetOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var order models.Order
	err = database.DB.QueryRow(
		"SELECT o.id, o.user_id, o.amount, o.status, o.created_at, u.name, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1",
		id,
	).Scan(&order.ID, &order.UserID, &order.Amount, &order.Status, &order.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// UpdateOrder - PUT /api/orders/:id
func (h *OrdersHandlers) UpdateOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=pending completed cancelled"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order models.Order
	err = database.DB.QueryRow(
		"UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, user_id, amount, status, created_at",
		req.Status, id,
	).Scan(&order.ID, &order.UserID, &order.Amount, &order.Status, &order.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// DeleteOrder - DELETE /api/orders/:id
func (h *OrdersHandlers) DeleteOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := database.DB.Exec("DELETE FROM orders WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.Status(http.StatusNoContent)
}
