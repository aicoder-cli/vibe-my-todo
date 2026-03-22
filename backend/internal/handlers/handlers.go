package handlers

import (
	"net/http"
	"strconv"
	"vibe-my-todo/internal/auth"
	"vibe-my-todo/internal/models"
	"vibe-my-todo/internal/repository"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	repo *repository.Repository
}

func NewHandler(repo *repository.Repository) *Handler {
	return &Handler{repo: repo}
}

// Register godoc
// @Summary 用户注册
// @Description 创建新用户账号
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "注册信息"
// @Success 201 {object} models.Response{data=models.AuthResponse}
// @Failure 400 {object} models.Response
// @Failure 409 {object} models.Response
// @Router /auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Failed to hash password",
		})
		return
	}

	user := &models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	if err := h.repo.CreateUser(user); err != nil {
		c.JSON(http.StatusConflict, models.Response{
			Success: false,
			Message: "User already exists",
		})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Data: models.AuthResponse{
			AccessToken: token,
			TokenType:   "Bearer",
			User: models.UserResponse{
				ID:       user.ID,
				Username: user.Username,
				Email:    user.Email,
			},
		},
	})
}

// Login godoc
// @Summary 用户登录
// @Description 用户登录获取 JWT 令牌
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "登录信息"
// @Success 200 {object} models.Response{data=models.AuthResponse}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Router /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	user, err := h.repo.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data: models.AuthResponse{
			AccessToken: token,
			TokenType:   "Bearer",
			User: models.UserResponse{
				ID:       user.ID,
				Username: user.Username,
				Email:    user.Email,
			},
		},
	})
}

// GetMe godoc
// @Summary 获取当前用户信息
// @Description 获取当前认证用户的信息
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.Response{data=models.UserResponse}
// @Failure 401 {object} models.Response
// @Failure 404 {object} models.Response
// @Router /auth/me [get]
func (h *Handler) GetMe(c *gin.Context) {
	userID, _ := c.Get("userID")
	user, err := h.repo.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, models.Response{
			Success: false,
			Message: "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data: models.UserResponse{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

// CreateTodo godoc
// @Summary 创建待办事项
// @Description 为当前用户创建新的待办事项
// @Tags todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateTodoRequest true "待办事项信息"
// @Success 201 {object} models.Response{data=models.Todo}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Router /todos [post]
func (h *Handler) CreateTodo(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req models.CreateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	if req.Priority == "" {
		req.Priority = "medium"
	}

	todo := &models.Todo{
		UserID:   userID.(uint),
		Text:     req.Text,
		Category: req.Category,
		Priority: req.Priority,
		DueDate:  req.DueDate,
	}

	if err := h.repo.CreateTodo(todo); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Failed to create todo",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Data:    todo,
	})
}

// GetTodos godoc
// @Summary 获取待办事项列表
// @Description 获取当前用户的待办事项列表，支持筛选
// @Tags todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "筛选状态: all/active/completed"
// @Param category query string false "筛选分类"
// @Success 200 {object} models.Response{data=[]models.Todo}
// @Failure 401 {object} models.Response
// @Router /todos [get]
func (h *Handler) GetTodos(c *gin.Context) {
	userID, _ := c.Get("userID")
	status := c.DefaultQuery("status", "all")
	category := c.DefaultQuery("category", "all")

	todos, err := h.repo.GetTodos(userID.(uint), status, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Failed to fetch todos",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    todos,
	})
}

// GetTodo godoc
// @Summary 获取单个待办事项
// @Description 根据 ID 获取单个待办事项
// @Tags todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "待办事项 ID"
// @Success 200 {object} models.Response{data=models.Todo}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 404 {object} models.Response
// @Router /todos/{id} [get]
func (h *Handler) GetTodo(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Invalid todo ID",
		})
		return
	}

	todo, err := h.repo.GetTodoByID(uint(id), userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, models.Response{
			Success: false,
			Message: "Todo not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    todo,
	})
}

// UpdateTodo godoc
// @Summary 更新待办事项
// @Description 更新待办事项信息
// @Tags todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "待办事项 ID"
// @Param request body models.UpdateTodoRequest true "更新信息"
// @Success 200 {object} models.Response{data=models.Todo}
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 404 {object} models.Response
// @Router /todos/{id} [put]
func (h *Handler) UpdateTodo(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Invalid todo ID",
		})
		return
	}

	todo, err := h.repo.GetTodoByID(uint(id), userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, models.Response{
			Success: false,
			Message: "Todo not found",
		})
		return
	}

	var req models.UpdateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	if req.Text != "" {
		todo.Text = req.Text
	}
	if req.Category != "" {
		todo.Category = req.Category
	}
	if req.Priority != "" {
		todo.Priority = req.Priority
	}
	if req.DueDate != nil {
		todo.DueDate = req.DueDate
	}
	if req.Completed != nil {
		todo.Completed = *req.Completed
	}

	if err := h.repo.UpdateTodo(todo); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Failed to update todo",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    todo,
	})
}

// DeleteTodo godoc
// @Summary 删除待办事项
// @Description 删除待办事项
// @Tags todos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "待办事项 ID"
// @Success 200 {object} models.Response
// @Failure 400 {object} models.Response
// @Failure 401 {object} models.Response
// @Failure 500 {object} models.Response
// @Router /todos/{id} [delete]
func (h *Handler) DeleteTodo(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Invalid todo ID",
		})
		return
	}

	if err := h.repo.DeleteTodo(uint(id), userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Failed to delete todo",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Todo deleted successfully",
	})
}
