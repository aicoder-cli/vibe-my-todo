package repository

import (
	"vibe-my-todo/internal/models"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *Repository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *Repository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *Repository) CreateTodo(todo *models.Todo) error {
	return r.db.Create(todo).Error
}

func (r *Repository) GetTodos(userID uint, status string, category string) ([]models.Todo, error) {
	var todos []models.Todo
	query := r.db.Where("user_id = ?", userID)

	if status == "active" {
		query = query.Where("completed = ?", false)
	} else if status == "completed" {
		query = query.Where("completed = ?", true)
	}

	if category != "all" {
		query = query.Where("category = ?", category)
	}

	err := query.Order("created_at DESC").Find(&todos).Error
	return todos, err
}

func (r *Repository) GetTodoByID(id uint, userID uint) (*models.Todo, error) {
	var todo models.Todo
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&todo).Error
	return &todo, err
}

func (r *Repository) UpdateTodo(todo *models.Todo) error {
	return r.db.Save(todo).Error
}

func (r *Repository) DeleteTodo(id uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Todo{}).Error
}
