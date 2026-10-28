# Enterprise Decision Intelligence Engine: Master Startup Script
# Starts PostgreSQL (5433), Python Analytics (5001), Express Backend (5000), and Vite Frontend (3000)

$ErrorActionPreference = "Stop"

$BASE_DIR = Resolve-Path "$PSScriptRoot\.."
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PG_DATA = Join-Path $BASE_DIR "database\pgdata"
$PG_PORT = 5433

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Enterprise Decision Intelligence Engine" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Ensure Database is Initialized and Running
if (-not (Test-Path $PG_DATA)) {
    Write-Host "[1/4] Database not initialized. Running setup-db.ps1..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File (Join-Path $BASE_DIR "scripts\setup-db.ps1")
} else {
    $pgRunning = $false
    try {
        $res = & "$PG_BIN\psql.exe" -U postgres -h 127.0.0.1 -p $PG_PORT -d postgres -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) { $pgRunning = $true }
    } catch { $pgRunning = $false }

    if (-not $pgRunning) {
        Write-Host "[1/4] Starting PostgreSQL server on port $PG_PORT..." -ForegroundColor Yellow
        $logFile = Join-Path $BASE_DIR "database\pg.log"
        & "$PG_BIN\pg_ctl.exe" -D $PG_DATA -o "-p $PG_PORT" -l $logFile start
        Start-Sleep -Seconds 2
    } else {
        Write-Host "[1/4] PostgreSQL is running on port $PG_PORT." -ForegroundColor Green
    }
}

# 2. Start Python Analytics Microservice (Port 5001)
Write-Host "[2/4] Starting Python Analytics Microservice (FastAPI on Port 5001)..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "analytics/main.py" -WorkingDirectory $BASE_DIR -WindowStyle Minimized

# 3. Start Node.js Backend API (Port 5000)
Write-Host "[3/4] Starting Node.js Backend API (Express on Port 5000)..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory (Join-Path $BASE_DIR "apps\backend") -WindowStyle Minimized

# 4. Start Vite Frontend (Port 3000)
Write-Host "[4/4] Starting React Frontend (Vite on Port 3000)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory (Join-Path $BASE_DIR "apps\frontend") -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "All Services Started Successfully!" -ForegroundColor Green
Write-Host "• Frontend Dashboard : http://localhost:3000" -ForegroundColor White
Write-Host "• Backend API Health : http://localhost:5000/api/health" -ForegroundColor White
Write-Host "• Python Analytics   : http://127.0.0.1:5001/health" -ForegroundColor White
Write-Host "• PostgreSQL Port    : 5433 (Database: enterprise_bi)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Opening Dashboard in default browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"
