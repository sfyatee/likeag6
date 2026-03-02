# G6Labs API Documentation

**Base URL (local development):**
http://localhost:8080

This document describes the server-side API. The backend is a Go HTTP server that has JSON endpoints for matrix operations and authentication, as well as redirect-based Google OAuth endpoints.

---

# 1. Matrix Addition API

## 1.1 Name

Add Matrices

## 1.2 Description

Adds two matrices element-by-element. Both matrices must have the same dimensions.

## 1.3 Endpoint (Signature)

```
POST /api/matrix/add
```

### Request Body

```json
{
  "A": [[...]],
  "B": [[...]]
}
```

### Go Types

```go
type Matrix [][]float64

type TwoMatrixRequest struct {
  A Matrix `json:"A"`
  B Matrix `json:"B"`
}
```

---

## 1.4 Parameters

| Name | Type       | Required | Description                                  |
| ---- | ---------- | -------- | -------------------------------------------- |
| A    | number[][] | Yes      | Rectangular matrix                           |
| B    | number[][] | Yes      | Rectangular matrix with same dimensions as A |

---

## 1.5 Return Value

Success (200 OK):

```json
{
  "result": [[...]]
}
```

Go Response Type:

```go
type OneMatrixResponse struct {
  Result Matrix `json:"result"`
  Error  string `json:"error,omitempty"`
}
```

---

## 1.6 Errors

| Condition          | HTTP Status | Example Message                                 |
| ------------------ | ----------- | ----------------------------------------------- |
| Not POST           | 405         | "use POST"                                      |
| Invalid JSON       | 400         | "invalid JSON: ..."                             |
| Matrix empty       | 400         | "matrix has zero rows"                          |
| Not rectangular    | 400         | "row 1 has length 2 (expected 3)"               |
| Dimension mismatch | 400         | "add requires same dimensions, got 2x2 and 1x3" |

---

## 1.7 Example

```bash
curl -X POST http://localhost:8080/api/matrix/add \
  -H "Content-Type: application/json" \
  -d '{"A":[[1,2],[3,4]],"B":[[5,6],[7,8]]}'
```

---

## 1.8 Notes / Limitations

- Matrices must be rectangular.
- Matrices cannot be empty.

---

# 2. Matrix Subtraction API

## 2.1 Name

**Subtract Matrices**

## 2.2 Description

Subtracts matrix B from matrix A

## 2.3 Endpoint

```
POST /api/matrix/subtract
```

Request format is identical to Matrix Addition.

---

## 2.4 Parameters

Same as Matrix Addition.

---

## 2.5 Return Value

Same JSON response format as Matrix Addition.

---

## 2.6 Errors

## Same as Addition, but dimension error message

## 2.7 Example

```bash
curl -X POST http://localhost:8080/api/matrix/subtract \
  -H "Content-Type: application/json" \
  -d '{"A":[[5,5],[5,5]],"B":[[1,2],[3,4]]}'
```

---

## 2.8 Notes

Same validation rules as Addition.

---

# 3. Matrix Multiplication API

## 3.1 Name

**Multiply Matrices**

## 3.2 Description

Performs matrix multiplication (A × B).

## 3.3 Endpoint

```
POST /api/matrix/multiply
```

---

## 3.4 Parameters

| Name | Type       | Required | Description                                 |
| ---- | ---------- | -------- | ------------------------------------------- |
| A    | number[][] | Yes      | Rectangular matrix                          |
| B    | number[][] | Yes      | Rectangular matrix where A.columns = B.rows |

---

## 3.5 Return Value

```json
{
  "result": [[...]]
}
```

---

## 3.6 Errors

| Condition           | HTTP Status | Example                                             |
| ------------------- | ----------- | --------------------------------------------------- |
| Column/row mismatch | 400         | "multiply requires A.cols == B.rows, got 2x3 · 2x2" |

Other validation errors are the same as Addition.

---

## 3.7 Example

```bash
curl -X POST http://localhost:8080/api/matrix/multiply \
  -H "Content-Type: application/json" \
  -d '{"A":[[1,2,3],[4,5,6]],"B":[[1,2],[3,4],[5,6]]}'
```

---

## 3.8 Notes

- Uses `float64`.

---

# 4. Matrix RREF API

## 4.1 Name

**Reduced Row Echelon Form (RREF)**

## 4.2 Description

Computes the RREF of a matrix using Gauss–Jordan elimination with partial pivoting.

Note: The frontend may compute RREF client-side to display step-by-step row operations, but this backend endpoint is still implemented.

---

## 4.3 Endpoint

```
POST /api/matrix/rref
```

### Request Body

```json
{
  "A": [[...]]
}
```

---

## 4.4 Parameters

| Name | Type       | Required | Description                   |
| ---- | ---------- | -------- | ----------------------------- |
| A    | number[][] | Yes      | Rectangular, non-empty matrix |

---

## 4.5 Return Value

```json
{
  "result": [[...]]
}
```

---

## 4.6 Errors

Same validation errors as other matrix endpoints.

---

## 4.7 Example

```bash
curl -X POST http://localhost:8080/api/matrix/rref \
  -H "Content-Type: application/json" \
  -d '{"A":[[1,2],[3,4]]}'
```

---

---

# 5. User Signup API

## 5.1 Name

**Create User Account**

## 5.2 Description

Creates a new user. Passwords are hashed using bcrypt before being stored in the database.

---

## 5.3 Endpoint

```
POST /api/auth/signup
```

### Request Body

```json
{
  "fName": "First",
  "lName": "Last",
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 5.4 Parameters

| Name     | Type   | Required | Description    |
| -------- | ------ | -------- | -------------- |
| fName    | string | Yes      | First name     |
| lName    | string | Yes      | Last name      |
| email    | string | Yes      | Must be unique |
| password | string | Yes      | Text password  |

---

## 5.5 Return Value

Success (201 Created):

```json
{
  "success": true,
  "message": "user created successfully",
  "user": {
    "id": 1,
    "fName": "...",
    "lName": "...",
    "email": "...",
    "avatar": ""
  }
}
```

---

## 5.6 Errors

| Condition        | Status | Message                   |
| ---------------- | ------ | ------------------------- |
| Missing fields   | 400    | "all fields are required" |
| User exists      | 409    | "user already exists"     |
| Database failure | 500    | "failed to create user"   |

---

## 5.7 Example

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fName":"Andy","lName":"Shin","email":"andy@example.com","password":"password123"}'
```

---

# 6. User Login API

## 6.1 Name

**Login User**

## 6.2 Description

Authenticates a user using email and password.

---

## 6.3 Endpoint

```
POST /api/auth/login
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

---

## 6.4 Parameters

| Name     | Type   | Required | Description   |
| -------- | ------ | -------- | ------------- |
| email    | string | Yes      | User email    |
| password | string | Yes      | Text password |

---

## 6.5 Return Value

Success (200 OK):

```json
{
  "success": true,
  "message": "login successful",
  "user": { ... }
}
```

---

## 6.6 Errors

| Condition           | Status | Message                     |
| ------------------- | ------ | --------------------------- |
| Invalid credentials | 401    | "invalid email or password" |
| Invalid JSON        | 400    | "invalid JSON"              |

---

# 7. Google OAuth Login (Redirect-Based)

## 7.1 Name

**Google OAuth Login Flow**

## 7.2 Description

Implements login via Google OAuth

These endpoints perform browser redirects and do not return JSON.

---

## 7.3 Start OAuth

```
GET /auth/google/login
```

Redirects user to Google login page.

---

## 7.4 OAuth Callback

```
GET /auth/google/callback
```

Google redirects here after login.

### Query Parameters

| Name  | Description                     |
| ----- | ------------------------------- |
| code  | Authorization code from Google  |
| state | CSRF protection value           |
| error | Error if user denied permission |

---

## 7.5 Behavior

- Exchanges code for token
- Fetches Google profile information
- Creates or retrieves user in database
- Returns HTML page that:
  - sets `localStorage.user`
  - redirects to `/dashboard`

---

## 7.6 Errors

| Condition              | Status | Example                    |
| ---------------------- | ------ | -------------------------- |
| State mismatch         | 400    | "invalid oauth state"      |
| Token exchange failure | 500    | "failed to exchange token" |
| Google error           | 400    | "OAuth error"              |

---
