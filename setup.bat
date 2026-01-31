@echo off
echo ==========================================
echo   Lapangan Sports Booking - Setup Script
echo ==========================================

echo.
echo [1/3] Checking prerequisites...
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH.
    echo Please read INSTALL.md for instructions.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js/npm is not installed or not in PATH.
    echo Please read INSTALL.md for instructions.
    pause
    exit /b 1
)
echo OK!

echo.
echo [2/3] Setting up Backend...
cd backend
echo Installing Go dependencies...
go mod tidy
if %errorlevel% neq 0 (
    echo Error installing Go dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Setting up Frontend...
cd frontend
echo Installing Node dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing Node dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ==========================================
echo   Setup Complete! 
echo ==========================================
echo.
echo To start the backend:
echo   cd backend
echo   go run cmd/server/main.go
echo.
echo To start the frontend:
echo   cd frontend
echo   npm run dev
echo.
pause
