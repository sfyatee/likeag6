# G6Labs (likeag6)

G6Labs is a Go-based web application for linear algebra learning and workflows. It combines:

- A matrix computation API (add, subtract, multiply, RREF)
- A browser UI for calculator, graphing, resources, and account flows
- MySQL-backed user and resources data
- Optional Google OAuth sign-in
- Optional local AI-assisted problem help using Ollama

This README is intended to be the first stop for new users and contributors.

## Table of Contents

1. Project Overview
2. Tech Stack and Dependencies
3. Architecture at a Glance
4. Repository Structure
5. Prerequisites
6. Installation
7. Database Setup and Connection
8. Configuration and Environment Variables
9. How the Environment Loader Works
10. Running the Application
11. API Overview
12. Testing
13. Troubleshooting
14. Security and Operational Notes
15. Branching and Versioning Model
16. Useful References

## 1. Project Overview

G6Labs serves HTML pages and JSON APIs from a single Go server.

### Core capabilities

- Matrix operations via REST endpoints:
  - `POST /api/matrix/add`
  - `POST /api/matrix/subtract`
  - `POST /api/matrix/multiply`
  - `POST /api/matrix/rref`
- User authentication:
  - Email/password signup and login backed by bcrypt + MySQL
  - Optional Google OAuth login
- Learning resources:
  - Resource type/tag APIs and filtered resource listing from MySQL
- Problem Assistance:
  - Optional AI chat endpoint that can call matrix operations internally

### Runtime flow

At startup, the app:

1. Loads environment variables (via `.env` when present)
2. Connects to MySQL (`InitDB`)
3. Initializes OAuth configuration (`InitOAuth`)
4. Registers page routes and API routes
5. Starts HTTP server on port `8080`

## 2. Tech Stack and Dependencies

### Language and platform

- Go `1.25.1` (as declared in `go.mod`)

### Direct Go dependencies

- `github.com/go-sql-driver/mysql`
  - MySQL database driver for `database/sql`
- `github.com/joho/godotenv`
  - Loads `.env` file values into process environment variables
- `golang.org/x/crypto`
  - Provides `bcrypt` for password hashing
- `golang.org/x/oauth2`
  - OAuth2 client implementation used for Google sign-in

### Indirect Go dependencies

- `cloud.google.com/go/compute/metadata`
- `filippo.io/edwards25519`

These are resolved by Go modules and should not need manual installation.

## 3. Architecture at a Glance

### Backend

- `main.go`
  - Matrix domain logic, route registration, server startup
- `db.go`
  - DB initialization, environment loading, connection pool setup
- `user.go`
  - User CRUD/auth methods and signup/login handlers
- `oauth.go`
  - Google OAuth login/callback handlers
- `resources.go`
  - Resource query/filter logic and handlers
- `assist.go`
  - AI assistance endpoint (Ollama integration)

### Frontend

- Static HTML pages in `frontend/`
- CSS/JS assets in `frontend/static/`
- Served by backend on `http://localhost:8080`

### Data

- MySQL schema defined in `schema.sql`
- Includes:
  - `users`
  - `resource_types`
  - `resource_tags`
  - `resources`
  - `resource_tag_map`

## 4. Repository Structure

```
.
|- main.go
|- db.go
|- user.go
|- oauth.go
|- resources.go
|- assist.go
|- schema.sql
|- .env.example
|- Dockerfile
|- docker-compose.yml
|- DEPLOY.md
|- docs/
|  |- api.md
|  |- user_guide.md
|- frontend/
|  |- *.html
|  |- static/
|     |- *.css
|     |- *.js
|- wasm/
|  |- wasm_test.go
```

## 5. Prerequisites

Install the following before running locally:

- Go (version compatible with `go.mod`, currently `1.25.1`)
- MySQL 8+ (local or hosted, e.g. Aiven)
- Git

Optional integrations:

- Google Cloud project + OAuth credentials (for Google login)
- Ollama running locally (for Problem Assistance AI chat)

## 6. Installation

### 6.1 Clone repository

macOS/Linux and Windows (PowerShell or Command Prompt):

```bash
git clone https://github.com/sfyatee/likeag6.git
cd likeag6
```

### 6.2 Install Go module dependencies

Preferred (module-aware):

macOS/Linux and Windows:

```bash
go mod download
```

Or:

macOS/Linux and Windows:

```bash
go mod tidy
```

Manual `go get ...` is usually unnecessary because dependencies are pinned in `go.mod`.

## 7. Database Setup and Connection

### 7.1 Create database

Example (local MySQL):

```sql
CREATE DATABASE IF NOT EXISTS g6labs;
```

### 7.2 Apply schema

From repository root:

macOS/Linux:

```bash
mysql -u <user> -p g6labs < schema.sql
```

Windows PowerShell:

```powershell
Get-Content .\schema.sql | mysql -u <user> -p g6labs
```

Windows Command Prompt:

```cmd
mysql -u <user> -p g6labs < schema.sql
```

This creates all required tables and seed rows for resource types/tags.

### 7.3 Connection behavior in code

The application builds DSN using:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Fallback defaults used when values are missing:

- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USER=root`
- `DB_NAME=g6labs`

No default password is applied.

### 7.4 Connection pool defaults

After connecting, the app sets:

- Max open connections: `25`
- Max idle connections: `5`

## 8. Configuration and Environment Variables

### 8.1 Create `.env`

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Windows Command Prompt:

```cmd
copy .env.example .env
```

### 8.2 Required and optional variables

#### Database

- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `3306`)
- `DB_USER` (default: `root`)
- `DB_PASSWORD` (no default)
- `DB_NAME` (default: `g6labs`)

#### Google OAuth (optional, required only for Google login)

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL` (default: `http://localhost:8080/auth/google/callback`)

#### Problem Assistance / Ollama (optional)

- `OLLAMA_BASE_URL` (default: `http://127.0.0.1:11434`)
- `OLLAMA_CHAT_MODEL` (default: `llama3.2:3b`)

### 8.3 Example `.env`

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=g6labs

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback

# Ollama (optional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=llama3.2:3b
```

## 9. How the Environment Loader Works

Environment loading is handled in `InitDB` using `godotenv.Load()`.

Key behavior:

- If `.env` exists, values are loaded into process environment
- If `.env` is missing, app logs a notice and continues with OS environment values
- Because `InitDB` runs before OAuth/assist initialization in `main`, variables for DB, OAuth, and Ollama can all come from `.env`

Practical implication:

- `.env` is the recommended local configuration source
- Production/container environments can rely on injected environment variables instead

## 10. Running the Application

From repository root:

macOS/Linux:

```bash
go run .
```

Windows PowerShell or Command Prompt:

```powershell
go run .
```

Expected startup output includes:

- Database connection success log
- Server URL: `http://localhost:8080`

The app attempts to open your default browser automatically.

## 11. API Overview

### Matrix APIs

- `POST /api/matrix/add`
- `POST /api/matrix/subtract`
- `POST /api/matrix/multiply`
- `POST /api/matrix/rref`

All matrix endpoints use JSON and return either:

- `{"result": ...}` on success
- `{"error": "..."}` on validation/runtime error

### Auth APIs

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /auth/google/login`
- `GET /auth/google/callback`

### Resource APIs

- `GET /api/resources/types`
- `GET /api/resources/tags`
- `GET /api/resources`

Optional query params for `GET /api/resources`:

- `skill_level`
- `types` (comma-separated IDs)
- `tags` (comma-separated IDs)
- `q` (search string)

### Assistance APIs

- `GET /api/assist/health`
- `POST /api/assist/chat`

See `docs/api.md` for detailed request/response examples.

## 12. Testing

Run all tests:

macOS/Linux:

```bash
go test ./...
```

Windows PowerShell or Command Prompt:

```powershell
go test ./...
```

The repository includes:

- Unit tests for matrix logic
- Endpoint-level integration tests for matrix handlers
- Additional tests in `wasm/`

## 13. Troubleshooting

### "Failed to connect to database"

- Verify MySQL is running and reachable
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Ensure target database exists and `schema.sql` has been applied

### Google OAuth not working

- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Ensure redirect URI in Google Console exactly matches `GOOGLE_REDIRECT_URL`
- Confirm callback route is reachable at `/auth/google/callback`

### Assistance chat errors

- Verify Ollama is running
- Confirm `OLLAMA_BASE_URL` is correct
- Pull/model availability should match `OLLAMA_CHAT_MODEL`

### 404 for static files

- Ensure app is run from repository root (so `frontend/` paths resolve)

## 14. Security and Operational Notes

- `.env` should never be committed (already ignored by `.gitignore`)
- Passwords are stored as bcrypt hashes
- OAuth `state` is currently process-level and noted in code as a simplification
- For production hardening, consider:
  - Per-session CSRF state storage for OAuth
  - HTTPS-only deployment
  - CORS and secure cookie/session controls
  - Structured logging and request tracing

## 15. Branching and Versioning Model

### Branches

| Branch           | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `main`           | Stable, production-ready code. Direct commits are discouraged. |
| `dev`            | Active integration branch. Features are merged here first.     |
| `feature/<name>` | Individual feature or fix work, branched from `dev`.           |

### Workflow

```
feature/<name>  →  dev  →  (PR + review + tests pass)  →  main
```

1. Branch from `dev`: `git checkout -b feature/my-feature dev`
2. Commit and push: `git push -u origin feature/my-feature`
3. Open a PR targeting `dev`; ensure all tests pass (`go test ./...`)
4. After review, merge to `dev`
5. When `dev` is stable, open a PR from `dev` → `main`

### Versioning

Releases follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

- **MAJOR** — breaking API or schema changes
- **MINOR** — new backwards-compatible features
- **PATCH** — bug fixes

For release tagging steps see [DEPLOY.md §7](DEPLOY.md).

## 16. Useful References

- API docs: `docs/api.md`
- User-facing walkthrough: `docs/user_guide.md`
- Database schema: `schema.sql`
- Environment template: `.env.example`
- Deployment guide: `DEPLOY.md`
