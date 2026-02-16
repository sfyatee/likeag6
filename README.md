# likeag6's transmogrifier

# DB Connection Info

mysqldb connection info stored in .env folder
.env folder has been added to .gitignore for security purposes
-- pull the latest git commit and run the command cp .env.example .env
-- update the .env file with the Aiven DB connection info located in team discord server
under the session-planning channel

# Google OAuth Setup

To enable Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add ALL of these:
   - `http://localhost:8080/auth/google/callback`
   - `http://127.0.0.1:8080/auth/google/callback`
   - Add any deployed domain: `https://yourdomain.com/auth/google/callback`
4. Save changes

**to test locally:**

- Copy the `.env` file (contains GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
- Make sure GOOGLE_REDIRECT_URL matches your setup
- If using a different port, update both `.env` and Google Cloud Console

-- install dependencies:
mysql driver:

1. go get github.com/go-sql-driver/mysql

bcrypt (stand-in for password hashing until OAuth is implemented): 2. go get golang.org/x/crypto/bcrypt

env loader:
go get github.com/joho/godotenv

oauth2:
go get golang.org/x/oauth2
go get golang.org/x/oauth2/google

-- run the application:
go run \*.go
