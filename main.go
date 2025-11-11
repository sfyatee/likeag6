package main

import (
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

func main() {
	// Serve frontend static files
	frontendDir := "frontend"

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

	port := 8080
	url := fmt.Sprintf("http://localhost:%d", port)
	fmt.Printf("🚀 G6Labs serving static frontend on %s\n", url)
	go openBrowser(url)
	fmt.Println("Press CTRL+C to stop")

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatal(err)
	}
}
