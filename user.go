package main

import (
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       int    `json:"id"`
	FName    string `json:"fName"`
	LName    string `json:"lName"`
	Password string `json:"password,omitempty"` // omitempty prevents sending in JSON
	Email    string `json:"email"`
	Avatar   string `json:"avatar"`
}

// hashPassword generates a bcrypt hash of the password
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// checkPasswordHash compares a password with a hash
func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// createUser inserts a new user into the database
func createUser(fName, lName, email, password string) (*User, error) {
	// Hash the password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return nil, err
	}

	// Insert user into database
	result, err := db.Exec(
		"INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)",
		fName, lName, email, hashedPassword,
	)
	if err != nil {
		return nil, err
	}

	// Get the inserted ID
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &User{
		ID:    int(id),
		FName: fName,
		LName: lName,
		Email: email,
	}, nil
}

// getUserByEmail retrieves a user from the database by email
func getUserByEmail(email string) (*User, error) {
	user := &User{}
	var passwordHash string

	err := db.QueryRow(
		"SELECT id, first_name, last_name, email, password_hash, COALESCE(avatar, '') FROM users WHERE email = ?",
		email,
	).Scan(&user.ID, &user.FName, &user.LName, &user.Email, &passwordHash, &user.Avatar)

	if err != nil {
		return nil, err
	}

	user.Password = passwordHash // Store hash temporarily for verification
	return user, nil
}

// updateUserAvatar updates the user's avatar in the database
func updateUserAvatar(email, avatar string) error {
	_, err := db.Exec("UPDATE users SET avatar = ? WHERE email = ?", avatar, email)
	return err
}

// API Handlers

type SignupRequest struct {
	FName    string `json:"fName"`
	LName    string `json:"lName"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	User    *User  `json:"user,omitempty"`
}

func handleSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, AuthResponse{Success: false, Message: "use POST"})
		return
	}

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, AuthResponse{Success: false, Message: "invalid JSON"})
		return
	}

	// Validate fields
	if req.FName == "" || req.LName == "" || req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, AuthResponse{Success: false, Message: "all fields are required"})
		return
	}

	// Check if user already exists
	_, err := getUserByEmail(req.Email)
	if err == nil {
		// User exists
		writeJSON(w, http.StatusConflict, AuthResponse{Success: false, Message: "user already exists"})
		return
	}

	// Create new user
	user, err := createUser(req.FName, req.LName, req.Email, req.Password)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, AuthResponse{Success: false, Message: "failed to create user"})
		return
	}

	// Return success (don't send password back)
	userResponse := &User{
		ID:     user.ID,
		FName:  user.FName,
		LName:  user.LName,
		Email:  user.Email,
		Avatar: user.Avatar,
	}

	writeJSON(w, http.StatusCreated, AuthResponse{
		Success: true,
		Message: "user created successfully",
		User:    userResponse,
	})
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, AuthResponse{Success: false, Message: "use POST"})
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, AuthResponse{Success: false, Message: "invalid JSON"})
		return
	}

	// Get user from database
	user, err := getUserByEmail(req.Email)
	if err != nil {
		// User not found
		writeJSON(w, http.StatusUnauthorized, AuthResponse{Success: false, Message: "invalid email or password"})
		return
	}

	// Check password
	if !checkPasswordHash(req.Password, user.Password) {
		writeJSON(w, http.StatusUnauthorized, AuthResponse{Success: false, Message: "invalid email or password"})
		return
	}

	// Return success (don't send password back)
	userResponse := &User{
		ID:     user.ID,
		FName:  user.FName,
		LName:  user.LName,
		Email:  user.Email,
		Avatar: user.Avatar,
	}

	writeJSON(w, http.StatusOK, AuthResponse{
		Success: true,
		Message: "login successful",
		User:    userResponse,
	})
}
