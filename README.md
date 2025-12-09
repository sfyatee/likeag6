# likeag6's transmogrifier

# DB Connection Info
mysqldb connection info stored in .env folder
.env folder has been added to .gitignore for security purposes 
-- pull the latest git commit and run the command cp .env.example .env
-- update the .env file with the Aiven DB connection info located in team discord server
under the session-planning channel

-- install dependencies:
mysql driver:
1. go get github.com/go-sql-driver/mysql 

bcrypt (stand-in for password hashing until OAuth is implemented):
2. go get golang.org/x/crypto/bcrypt

env loader:
go get github.com/joho/godotenv

-- run the application:
go run *.go