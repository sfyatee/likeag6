package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

//  OAuth2 config
var googleOAuthConfig *oauth2.Config

func InitOAuth() {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/auth/google/callback"
	}

	if clientID == "" || clientSecret == "" {
		log.Println(" GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set; Google OAuth will not work.")
	}

	googleOAuthConfig = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

// Generates a random state string for CSRF protection
func generateState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// This should ideally be stored in a cookie or session; for now we keep it simple.
var oauthState string

// /auth/google/login
func handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	if googleOAuthConfig == nil || googleOAuthConfig.ClientID == "" {
		http.Error(w, "Google OAuth not configured", http.StatusInternalServerError)
		return
	}

	state, err := generateState()
	if err != nil {
		http.Error(w, "failed to generate state", http.StatusInternalServerError)
		return
	}
	oauthState = state // NOTE: for real prod, use per-user state with cookies

	url := googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// /auth/google/callback
func handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	if r.FormValue("state") != oauthState {
		http.Error(w, "invalid oauth state", http.StatusBadRequest)
		return
	}

	code := r.FormValue("code")
	if code == "" {
		http.Error(w, "code not found", http.StatusBadRequest)
		return
	}

	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "failed to exchange token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Use the token to get user info
	client := googleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		http.Error(w, "failed to get user info: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		http.Error(w, "failed to parse user info: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Map Google user to our DB user
	// If user exists -> return it; if not -> create it
	appUser, err := getOrCreateOAuthUser(userInfo.GivenName, userInfo.FamilyName, userInfo.Email, userInfo.Picture)
	if err != nil {
		http.Error(w, "failed to save user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Now we need to "log them in" in a way that matches your current front-end approach.
	// Your current login flow returns JSON and the frontend stores `user` in localStorage.
	// We'll do something similar: render a tiny HTML page that sets localStorage and redirects.

	type tmplData struct {
		UserJSON template.JS
	}

	userJSONBytes, _ := json.Marshal(appUser)
	data := tmplData{UserJSON: template.JS(userJSONBytes)}

	const page = `
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Logging you in...</title></head>
  <body>
    <script>
      // Set the "user" in localStorage like the normal login flow does
      const user = {{ .UserJSON }};
      localStorage.setItem('user', JSON.stringify(user));
      // Redirect to dashboard
      window.location.href = '/dashboard';
    </script>
  </body>
</html>`

	t := template.Must(template.New("oauth-success").Parse(page))
	if err := t.Execute(w, data); err != nil {
		http.Error(w, "failed to render page: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
