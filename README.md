# LAPANGAN MIGAS 61 BOOKING SYSTEM

A full-stack sports field rental website with User and Admin roles.

## Tech Stack

- **Frontend:** React.js + Tailwind CSS (Vite)
- **Backend:** Golang (Gin Framework)
- **Database:** PostgreSQL
- **Authentication:** JWT
- **Payment:** QRIS (Simulated)

## Prerequisites

- Go 1.21+ (Required)
- Node.js 18+ (Required)
- Docker (Optional, for PostgreSQL)

> **Note:** Since Docker might not be available, the project defaults to **SQLite** for the database. No external database setup is required to run locally!

## Setup & Installation

### 1. Database Setup

By default, the app uses **SQLite** (file-based database).
If you want to use PostgreSQL, update `backend/.env` to set `DB_TYPE=postgres` and ensure your database is running.

### 2. Backend Setup

```bash
cd backend
# Install dependencies
go mod tidy
# Run the server
go run cmd/server/main.go
```

The backend server will start on `http://localhost:8080`.

### 3. Frontend Setup

```bash
cd frontend
# Install dependencies
npm install
# Run the development server
npm run dev
```

The frontend will start on `http://localhost:5173`.

## Features

- **Public User:** View fields, Register, Login.
- **Authenticated User:** Book fields, Pay via QRIS, View Dashboard/History.
- **Admin:** (API ready) Manage fields, bookings, and users.

## Project Structure

```
lapangan/
├── backend/            # Golang Backend
│   ├── cmd/server/     # Entry point
│   ├── internal/       # Application code (Clean Arch)
│   │   ├── config/     # DB Config
│   │   ├── controllers/# HTTP Handlers
│   │   ├── models/     # DB Models
│   │   └── routes/     # API Routes
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   └── api/        # Axios setup
└── docker-compose.yml  # Database setup
```

## Admin Credentials

The system automatically seeds an admin user for testing purposes:

- **Email:** `admin@lapangan.com`
- **Password:** `Admin123!`

