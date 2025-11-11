package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"gonum.org/v1/gonum/mat"
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

// ---------- Matrix types and gonum-backed operations ----------
type Matrix [][]float64

type TwoMatrixRequest struct {
	A Matrix `json:"A"`
	B Matrix `json:"B"`
}

type OneMatrixRequest struct {
	A Matrix `json:"A"`
}

type OneMatrixResponse struct {
	Result Matrix `json:"result"`
	Error  string `json:"error,omitempty"`
}

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

func toDense(m Matrix) (*mat.Dense, error) {
	if err := validateRect(m); err != nil {
		return nil, err
	}
	r, c := dims(m)
	data := make([]float64, r*c)
	for i := 0; i < r; i++ {
		for j := 0; j < c; j++ {
			data[i*c+j] = m[i][j]
		}
	}
	return mat.NewDense(r, c, data), nil
}

func fromDense(d *mat.Dense) Matrix {
	r, c := d.Dims()
	M := make(Matrix, r)
	for i := 0; i < r; i++ {
		row := make([]float64, c)
		for j := 0; j < c; j++ {
			row[j] = d.At(i, j)
		}
		M[i] = row
	}
	return M
}

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
	ad, _ := toDense(A)
	bd, _ := toDense(B)
	rd := mat.NewDense(ar, ac, nil)
	rd.Add(ad, bd)
	return fromDense(rd), nil
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
	ad, _ := toDense(A)
	bd, _ := toDense(B)
	rd := mat.NewDense(ar, ac, nil)
	rd.Sub(ad, bd)
	return fromDense(rd), nil
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
	ad, _ := toDense(A)
	bd, _ := toDense(B)
	rd := mat.NewDense(ar, bc, nil)
	rd.Mul(ad, bd)
	return fromDense(rd), nil
}

// rref performs Gauss-Jordan elimination with partial pivoting.
func rref(A Matrix) (Matrix, error) {
	if err := validateRect(A); err != nil {
		return nil, err
	}
	r, c := dims(A)
	M := make(Matrix, r)
	for i := 0; i < r; i++ {
		M[i] = make([]float64, c)
		copy(M[i], A[i])
	}

	const eps = 1e-10
	row := 0
	for col := 0; col < c && row < r; col++ {
		piv := row
		maxAbs := math.Abs(M[piv][col])
		for i := row + 1; i < r; i++ {
			if v := math.Abs(M[i][col]); v > maxAbs {
				maxAbs = v
				piv = i
			}
		}
		if maxAbs < eps {
			continue
		}
		if piv != row {
			M[piv], M[row] = M[row], M[piv]
		}
		p := M[row][col]
		for j := col; j < c; j++ {
			M[row][j] /= p
		}
		for i := 0; i < r; i++ {
			if i == row {
				continue
			}
			f := M[i][col]
			if math.Abs(f) < eps {
				continue
			}
			for j := col; j < c; j++ {
				M[i][j] -= f * M[row][j]
			}
		}
		row++
	}
	for i := 0; i < r; i++ {
		for j := 0; j < c; j++ {
			if math.Abs(M[i][j]) < 1e-12 {
				M[i][j] = 0
			}
		}
	}
	return M, nil
}

// ---------- HTTP helpers ----------
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

func parseOneMatrixJSON(w http.ResponseWriter, r *http.Request) (*OneMatrixRequest, bool) {
	defer r.Body.Close()
	var req OneMatrixRequest
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

func handleRREF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, OneMatrixResponse{Error: "use POST"})
		return
	}
	req, ok := parseOneMatrixJSON(w, r)
	if !ok {
		return
	}
	res, err := rref(req.A)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, OneMatrixResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, OneMatrixResponse{Result: res})
}

// ---------- main: static server + API ----------
func main() {
	frontendDir := "frontend"

	// file server for static assets with correct MIME types for wasm/js
	fs := http.FileServer(http.Dir(frontendDir))
	http.Handle("/static/", http.StripPrefix("/static/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// r.URL.Path here points inside the frontend directory because of the StripPrefix
		if strings.HasSuffix(r.URL.Path, ".wasm") {
			w.Header().Set("Content-Type", "application/wasm")
		} else if strings.HasSuffix(r.URL.Path, ".js") {
			w.Header().Set("Content-Type", "application/javascript")
		}
		// Let the file server serve the file (it will handle 404s)
		fs.ServeHTTP(w, r)
	})))

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

	// API endpoints backed by gonum
	http.HandleFunc("/api/matrix/add", handleAdd)
	http.HandleFunc("/api/matrix/subtract", handleSub)
	http.HandleFunc("/api/matrix/multiply", handleMul)
	http.HandleFunc("/api/matrix/rref", handleRREF)

	port := 8080
	url := fmt.Sprintf("http://localhost:%d", port)
	fmt.Printf("🚀 G6Labs running on %s\n", url)
	go openBrowser(url)
	fmt.Println("Press CTRL+C to stop")

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatal(err)
	}
}
