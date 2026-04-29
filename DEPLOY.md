# G6Labs — Deployment Guide

This document covers deploying G6Labs by running the Go binary directly on a Linux, macOS, or Windows host.

For local development setup see [README.md](README.md).

---

## Table of Contents

1. Prerequisites
2. Environment Configuration
3. Deployment
4. Database Migration
5. Running and Validating
6. Updating / Re-deploying
7. Release and Version Tagging

---

## 1. Prerequisites

See [README.md §5](README.md) for the full prerequisites list. For production you additionally need the target host accessible and MySQL reachable from it.

---

## 2. Environment Configuration

Copy the example file and fill in your values before deploying:

```bash
cp .env.example .env
```

For the full list of variables, defaults, and optional feature flags see [README.md §8](README.md).

> **Security note:** Never commit `.env` to source control. It is already listed in `.gitignore`.

---

## 3. Deployment

### 3.1 Clone and install dependencies

```bash
git clone https://github.com/sfyatee/likeag6.git
cd likeag6
go mod download
```

### 3.2 Apply the database schema

```bash
mysql -u <user> -p <database> < schema.sql
```

### 3.3 Build the binary

```bash
go build -o g6labs .
```

### 3.4 Run

```bash
./g6labs
```

The server starts on port `8080`. Expected output:

```
Database connection established
http server listening at http://localhost:8080
```

### 3.5 Run as a systemd service (Linux)

Create `/etc/systemd/system/g6labs.service`:

```ini
[Unit]
Description=G6Labs web application
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/g6labs
EnvironmentFile=/opt/g6labs/.env
ExecStart=/opt/g6labs/g6labs
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable g6labs
sudo systemctl start g6labs
```

---

## 4. Database Migration

Apply or re-apply the schema against an existing database:

```bash
# macOS / Linux
mysql -u <user> -p <dbname> < schema.sql

# Windows PowerShell
Get-Content .\schema.sql | mysql -u <user> -p <dbname>
```

---

## 5. Running and Validating

### Basic connectivity check

```bash
curl http://localhost:8080/
```

Expected: HTTP 200 with the landing page HTML.

### API smoke tests

```bash
# Matrix add (returns result matrix)
curl -s -X POST http://localhost:8080/api/matrix/add \
  -H "Content-Type: application/json" \
  -d '{"A":[[1,2],[3,4]],"B":[[5,6],[7,8]]}' | python3 -m json.tool

# Assistance service health (requires Ollama)
curl http://localhost:8080/api/assist/health
```

For running the full test suite see [README.md §12](README.md).

---

## 6. Updating / Re-deploying

```bash
git pull origin main
go build -o g6labs .
sudo systemctl restart g6labs   # if using systemd
```

---

## 7. Release and Version Tagging

Releases follow **semantic versioning** (`MAJOR.MINOR.PATCH`). See [README.md §15](README.md) for the full branching model and PR workflow.

To tag a release from `main`:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```
