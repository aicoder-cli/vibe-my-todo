package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Username     string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email        string         `json:"email" gorm:"uniqueIndex;not null;size:100"`
	PasswordHash string         `json:"-" gorm:"not null;size:255"`
	Todos        []Todo         `json:"todos,omitempty" gorm:"foreignKey:UserID"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

type Todo struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	Text      string         `json:"text" gorm:"not null;type:text"`
	Category  string         `json:"category" gorm:"not null;size:50"`
	Priority  string         `json:"priority" gorm:"default:'medium';size:20"`
	DueDate   *time.Time     `json:"due_date,omitempty"`
	Completed bool           `json:"completed" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
	User        UserResponse `json:"user"`
}

type UserResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

type CreateTodoRequest struct {
	Text     string     `json:"text" binding:"required"`
	Category string     `json:"category" binding:"required"`
	Priority string     `json:"priority"`
	DueDate  *time.Time `json:"due_date,omitempty"`
}

type UpdateTodoRequest struct {
	Text      string     `json:"text"`
	Category  string     `json:"category"`
	Priority  string     `json:"priority"`
	DueDate   *time.Time `json:"due_date,omitempty"`
	Completed *bool      `json:"completed,omitempty"`
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}
