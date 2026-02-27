# G6Labs — User Guide

## Who This Guide Is For

This guide is for **new users** who want to run and use G6Labs for the first time. You should be comfortable using a web browser and following step-by-step instructions. Some steps require typing commands into a terminal, but each command is fully explained so no prior programming experience is needed.

---

## System Overview

**G6Labs** is a browser-based linear algebra tool. It lets you:

- **Calculate with matrices** — add, subtract, multiply, or reduce matrices step by step
- **Visualize matrix transformations** — see how a 2×2 matrix transforms vectors in 2D or 3D space

You run it locally on your computer and access it through any web browser at `http://localhost:8080`.

---

## Installation and Setup

### What You Need Before Starting

- **Go** (version 1.21 or later) — download from [go.dev/dl](https://go.dev/dl/)
- **Git** — download from [git-scm.com](https://git-scm.com/)
- **MySQL** (version 8.0 or later) — download from [dev.mysql.com/downloads](https://dev.mysql.com/downloads/mysql/)

> No cloud accounts or team credentials are needed. The app connects to a local MySQL database running on your own machine.

> **What is a terminal?** On Windows, search for "PowerShell". On Mac, search for "Terminal". On Linux, use your system terminal. All commands below are typed there and run by pressing Enter.

---

### Step 1 — Download the Project

Open your terminal and run:

```bash
git clone https://github.com/sfyatee/likeag6.git
cd likeag6
```

This downloads the project and moves you into the project folder.

---

### Step 2 — Set Up the Local Database

The app connects to a local MySQL database on your machine. You need to create the database and load the schema before running the app.

**2a — Create the database**

Open a terminal and log into MySQL:

```bash
mysql -u root -p
```

Enter your MySQL root password when prompted. Then run:

```sql
CREATE DATABASE IF NOT EXISTS g6labs;
EXIT;
```

**2b — Load the schema**

**Mac / Linux:**
```bash
mysql -u root -p g6labs < schema.sql
```

**Windows (PowerShell):**
```powershell
mysql -u root -p g6labs < schema.sql
```

**Windows (Command Prompt):**
```cmd
mysql -u root -p g6labs < schema.sql
```

This creates the `users` table the app needs. You only have to do this once.

**2c — Create the `.env` file**

**Mac / Linux:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

Open the `.env` file in any text editor and set it to your local MySQL configuration:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-local-mysql-password
DB_NAME=g6labs
```

Replace `your-local-mysql-password` with the password you set when installing MySQL. If you didn't set one, leave `DB_PASSWORD` blank.

Save the file when done. It is never shared or uploaded — it's blocked by `.gitignore`.

---

### Step 3 — Install Dependencies

Run these three commands one at a time:

```bash
go get github.com/go-sql-driver/mysql
go get golang.org/x/crypto/bcrypt
go get github.com/joho/godotenv
```

Each one downloads a small package the app needs to run. You only need to do this once.

---

### Step 4 — Start the Application

**Mac / Linux:**
```bash
go run *.go
```

**Windows (PowerShell or Command Prompt):**
```powershell
go run .
```

> The `*.go` glob doesn't work in Windows terminals — use `go run .` instead, which does the same thing.

After a few seconds you should see:

```
Database connection established
🚀 G6Labs running on http://localhost:8080
Press CTRL+C to stop
```

Your browser should open automatically. If it doesn't, open any browser and go to `http://localhost:8080`.

To stop the app at any time, press **CTRL+C** in the terminal.

---

## Core Workflow: Matrix Calculator

The Matrix Calculator lets you perform operations on one or two matrices and see the results instantly.

### Step 1 — Open the Calculator

From the G6Labs home page, click the **Calculator** button in the top navigation bar. This takes you to the matrix calculator page.

### Step 2 — Set Your Matrix Size

In the left panel under **Matrix Sizes**, set the number of rows and columns for Matrix A and Matrix B. For example, enter `2` rows and `2` columns for both to work with 2×2 matrices.

> The size inputs update the grid automatically — no need to refresh the page.

### Step 3 — Enter Your Values

Click into each cell of the Matrix A and Matrix B grids and type your numbers. You can also use the quick-fill buttons above each matrix:

| Button       | What It Does                    |
|--------------|---------------------------------|
| **Zeros**    | Fills every cell with 0         |
| **Ones**     | Fills every cell with 1         |
| **Identity** | Creates a diagonal matrix of 1s |
| **Random**   | Fills cells with random numbers |

Use **Clear All** in the top right of the panel to reset everything.

### Step 4 — Choose an Operation

Click one of the operation buttons:

| Operation    | What It Requires                      |
|--------------|---------------------------------------|
| **Add**      | A and B must have the same dimensions |
| **Subtract** | A and B must have the same dimensions |
| **Multiply** | Columns of A must equal rows of B     |
| **RREF**     | Works on Matrix A only                |

### Step 5 — Read the Result

The result matrix appears in the right panel. Each value is displayed in a formatted matrix grid.

If something goes wrong — for example, mismatched dimensions — an error message will appear in place of the result explaining exactly what the issue is.

---

## Core Workflow: Graphing

The Graphing tool shows you visually what a 2×2 matrix does to a set of vectors.

### Step 1 — Open the Graphing Page

From the home page, click the **Graphing** button in the top navigation bar.

### Step 2 — Choose a Display Mode

At the top of the control panel, select either:
- **2D** — shows the transformation on a flat plane
- **3D** — shows the transformation in three-dimensional space

### Step 3 — Apply a Preset (Optional)

Use the **Preset** dropdown to load a well-known transformation automatically. Options include:

| Preset                | What It Shows                                 |
|-----------------------|-----------------------------------------------|
| Identity              | No transformation — vectors stay in place     |
| Scale Up / Scale Down | Vectors grow or shrink                        |
| Rotate 30°            | Vectors rotate counterclockwise by 30 degrees |
| Shear X               | Vectors are slanted along the X axis          |
| Reflect X / Reflect Y | Vectors are mirrored across an axis           |

Selecting a preset fills in the matrix values automatically so you can see the exact numbers behind each transformation.

### Step 4 — Edit the Matrix Manually (Optional)

You can type directly into the **Matrix A (2×2)** grid to create a custom transformation. Click **Apply Matrix** to update the visualization.

### Step 5 — Export (Optional)

Click **Export PNG** to save the current canvas view as an image file.

---

## Where Outputs Appear and How to Interpret Them

| Location                       | What It Shows                                            |
|--------------------------------|----------------------------------------------------------|
| **Calculator — right panel**   | Your result matrix after the chosen operation            |
| **Calculator — error message** | What went wrong if dimensions are invalid                |
| **Graphing canvas**            | Colored vectors showing how your matrix transforms space |
| **Terminal**                   | Server status messages and any connection errors         |

**Reading an RREF result:** Each row represents a simplified equation. A row of all zeros means one equation was dependent on another. A leading `1` in a row (called a pivot) marks a basic variable — its column position tells you which variable it corresponds to.

**Reading the graph:** The vectors shown are the columns of your matrix applied to the standard basis. When you change the matrix values and hit **Apply Matrix**, you'll see those vectors move — that movement *is* the transformation.

---

## Troubleshooting

### The app closes immediately with a database error

**Symptom:**
```
Failed to connect to database: error connecting to database: ...
```

**Cause:** The `.env` file is missing, the database doesn't exist yet, or the credentials are wrong.

**Fix:**
1. Make sure MySQL is running on your machine
2. Confirm the `g6labs` database exists (`SHOW DATABASES;` inside the MySQL shell)
3. Make sure you ran `schema.sql` against it (Step 2b above)
4. Open `.env` and verify `DB_HOST=localhost`, `DB_PORT=3306`, and that `DB_PASSWORD` matches your local MySQL root password

---

### `go run *.go` fails with "cannot find package"

**Symptom:**
```
cannot find package "github.com/joho/godotenv"
```

**Cause:** One or more dependencies were not installed.

**Fix:** Re-run all three install commands:

```bash
go get github.com/go-sql-driver/mysql
go get golang.org/x/crypto/bcrypt
go get github.com/joho/godotenv
```

If the error still appears, confirm your Go version is 1.21 or later:

```bash
go version
```

---

### Port 8080 is already in use

**Symptom:**
```
listen tcp :8080: bind: address already in use
```

**Cause:** A previous instance of the app (or another program) is still running on port 8080.

**Fix:** Find and stop the conflicting process, then restart the app:

**Mac / Linux:**
```bash
# Find what is using port 8080
lsof -i :8080

# Stop it using the PID shown in the output
kill -9 <PID>

# Then restart
go run *.go
```

**Windows (PowerShell):**
```powershell
# Find what is using port 8080
netstat -ano | findstr :8080

# Stop it using the PID shown in the last column
taskkill /PID <PID> /F

# Then restart
go run .
```
