package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go-gin/internal/database"
	"go-gin/internal/models"
)

// UsersHandlers handles user-related requests
type UsersHandlers struct{}

func NewUsersHandlers() *UsersHandlers {
	return &UsersHandlers{}
}

// CreateUser - POST /api/users
func (h *UsersHandlers) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := database.DB.QueryRow(
		"INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at",
		req.Name, req.Email,
	).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// GetUsers - GET /api/users
func (h *UsersHandlers) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	rows, err := database.DB.Query(
		"SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
		limit, offset,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		users = append(users, user)
	}

	var total int
	database.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&total)

	c.JSON(http.StatusOK, gin.H{
		"data":  users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetUser - GET /api/users/:id
func (h *UsersHandlers) GetUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var user models.User
	err = database.DB.QueryRow(
		"SELECT id, name, email, created_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateUser - PUT /api/users/:id
func (h *UsersHandlers) UpdateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err = database.DB.QueryRow(
		"UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, name, email, created_at",
		req.Name, req.Email, id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// DeleteUser - DELETE /api/users/:id
func (h *UsersHandlers) DeleteUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := database.DB.Exec("DELETE FROM users WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetUserWithOrders - GET /api/users/:id/orders (JOIN query)
func (h *UsersHandlers) GetUserWithOrders(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var user models.User
	err = database.DB.QueryRow(
		"SELECT id, name, email, created_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	rows, err := database.DB.Query(
		"SELECT id, user_id, amount, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
		id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		if err := rows.Scan(&order.ID, &order.UserID, &order.Amount, &order.Status, &order.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		orders = append(orders, order)
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,
		"name":      user.Name,
		"email":     user.Email,
		"createdAt": user.CreatedAt,
		"orders":    orders,
	})
}

// GetUserStats - GET /api/users/:id/stats (aggregation)
func (h *UsersHandlers) GetUserStats(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var user models.User
	err = database.DB.QueryRow(
		"SELECT id, name, email, created_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var stats struct {
		TotalOrders int     `json:"totalOrders"`
		TotalAmount float64 `json:"totalAmount"`
		AvgAmount   float64 `json:"avgAmount"`
	}

	database.DB.QueryRow(
		"SELECT COUNT(*), COALESCE(SUM(amount), 0), COALESCE(AVG(amount), 0) FROM orders WHERE user_id = $1",
		id,
	).Scan(&stats.TotalOrders, &stats.TotalAmount, &stats.AvgAmount)

	c.JSON(http.StatusOK, stats)
}
