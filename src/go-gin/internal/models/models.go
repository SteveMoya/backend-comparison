package models

import "time"

type User struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"size:100;not null"`
	Email     string    `json:"email" gorm:"size:255;uniqueIndex;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

type Order struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	UserID    int       `json:"user_id" gorm:"index;not null"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Amount    float64   `json:"amount" gorm:"type:decimal(10,2);not null"`
	Status    string    `json:"status" gorm:"size:20;default:pending"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

type CreateUserRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=100"`
	Email string `json:"email" binding:"required,email"`
}

type UpdateUserRequest struct {
	Name  *string `json:"name,omitempty" binding:"omitempty,min=1,max=100"`
	Email *string `json:"email,omitempty" binding:"omitempty,email"`
}

type CreateOrderRequest struct {
	UserID int     `json:"userId" binding:"required"`
	Amount float64 `json:"amount" binding:"required,min=0"`
	Status *string `json:"status,omitempty" binding:"omitempty,oneof=pending completed cancelled"`
}

type PaginationQuery struct {
	Page  int `form:"page" binding:"omitempty,min=1"`
	Limit int `form:"limit" binding:"omitempty,min=1,max=100"`
}
