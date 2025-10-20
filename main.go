package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
)

// ---------- Utils: open browser ----------
func openBrowser(url string) {
	var cmd string
	var args []string
	switch runtime.GOOS {
	case "windows":
		cmd = "rundll32"
		args = []string{"url.dll,FileProtocolHandler", url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	default:
		cmd = "xdg-open"
		args = []string{url}
	}
	_ = exec.Command(cmd, args...).Start()
}

// ---------- Matrix types ----------
type Matrix [][]float64

type TwoMatrixRequest struct {
	A Matrix `json:"A"`
	B Matrix `json:"B"`
}

type OneMatrixResponse struct {
	Result Matrix `json:"result"`
	Error  string `json:"error,omitempty"`
}

// ---------- Validation helpers ----------
func dims(m Matrix) (int, int) {
	if len(m) == 0 {
		return 0, 0
	}
	return len(m), len(m[0])
}

func validateRect(m Matrix) error {
	if len(m) == 0 {
		return errors.New("matrix has zero rows")
	}
	c := len(m[0])
	if c == 0 {
		return errors.New("matrix has zero columns")
	}
	for i := range m {
		if len(m[i]) != c {
			return fmt.Errorf("row %d has length %d (expected %d)", i, len(m[i]), c)
		}
	}
	return nil
}

// ---------- Operations ----------
func add(A, B Matrix) (Matrix, error) {
	if err := validateRect(A); err != nil {
		return nil, fmt.Errorf("A: %w", err)
	}
	if err := validateRect(B); err != nil {
		return nil, fmt.Errorf("B: %w", err)
	}
	ar, ac := dims(A)
	br, bc := dims(B)
	if ar != br || ac != bc {
		return nil, fmt.Errorf("add requires same dimensions, got %dx%d and %dx%d", ar, ac, br, bc)
	}
	R := make(Matrix, ar)
	for i := 0; i < ar; i++ {
		R[i] = make([]float64, ac)
		for j := 0; j < ac; j++ {
			R[i][j] = A[i][j] + B[i][j]
		}
	}
	return R, nil
}

func sub(A, B Matrix) (Matrix, error) {
	if err := validateRect(A); err != nil {
		return nil, fmt.Errorf("A: %w", err)
	}
	if err := validateRect(B); err != nil {
		return nil, fmt.Errorf("B: %w", err)
	}
	ar, ac := dims(A)
	br, bc := dims(B)
	if ar != br || ac != bc {
		return nil, fmt.Errorf("subtract requires same dimensions, got %dx%d and %dx%d", ar, ac, br, bc)
	}
	R := make(Matrix, ar)
	for i := 0; i < ar; i++ {
		R[i] = make([]float64, ac)
		for j := 0; j < ac; j++ {
			R[i][j] = A[i][j] - B[i][j]
		}
	}
	return R, nil
}

func mul(A, B Matrix) (Matrix, error) {
	if err := validateRect(A); err != nil {
		return nil, fmt.Errorf("A: %w", err)
	}
	if err := validateRect(B); err != nil {
		return nil, fmt.Errorf("B: %w", err)
	}
	ar, ac := dims(A)
	br, bc := dims(B)
	if ac != br {
		return nil, fmt.Errorf("multiply requires A.cols == B.rows, got %dx%d · %dx%d", ar, ac, br, bc)
	}
	R := make(Matrix, ar)
	for i := 0; i < ar; i++ {
		R[i] = make([]float64, bc)
		for j := 0; j < bc; j++ {
			sum := 0.0
			for k := 0; k < ac; k++ {
				sum += A[i][k] * B[k][j]
			}
			R[i][j] = sum
		}
	}
	return R, nil
}

// ---------- HTTP handlers ----------
func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func parseTwoMatrixJSON(w http.ResponseWriter, r *http.Request) (*TwoMatrixRequest, bool) {
	defer r.Body.Close()
	var req TwoMatrixRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, OneMatrixResponse{Error: "invalid JSON: " + err.Error()})
		return nil, false
	}
	return &req, true
}

func handleAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, OneMatrixResponse{Error: "use POST"})
		return
	}
	req, ok := parseTwoMatrixJSON(w, r)
	if !ok {
		return
	}
	res, err := add(req.A, req.B)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, OneMatrixResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, OneMatrixResponse{Result: res})
}

func handleSub(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, OneMatrixResponse{Error: "use POST"})
		return
	}
	req, ok := parseTwoMatrixJSON(w, r)
	if !ok {
		return
	}
	res, err := sub(req.A, req.B)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, OneMatrixResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, OneMatrixResponse{Result: res})
}

func handleMul(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, OneMatrixResponse{Error: "use POST"})
		return
	}
	req, ok := parseTwoMatrixJSON(w, r)
	if !ok {
		return
	}
	res, err := mul(req.A, req.B)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, OneMatrixResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, OneMatrixResponse{Result: res})
}

func main() {
	frontendDir := "frontend"

	// Static files (JS/CSS) under /static/
	fs := http.FileServer(http.Dir(frontendDir))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	landingPage := filepath.Join(frontendDir, "index.html")
	calcPage := filepath.Join(frontendDir, "matrixCalc.html")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/":
			http.ServeFile(w, r, landingPage)
		case "/matrixCalc":
			http.ServeFile(w, r, calcPage)
		default:
			http.NotFound(w, r)
		}
	})

	// API routes
	http.HandleFunc("/api/matrix/add", handleAdd)
	http.HandleFunc("/api/matrix/subtract", handleSub)
	http.HandleFunc("/api/matrix/multiply", handleMul)

	port := 8080
	url := fmt.Sprintf("http://localhost:%d", port)
	fmt.Printf("🚀 G6Labs running on %s\n", url)
	go openBrowser(url)
	fmt.Println("Press CTRL+C to stop")

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatal(err)
	}
}
