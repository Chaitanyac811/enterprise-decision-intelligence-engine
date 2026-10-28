# Setup and Initialize PostgreSQL Database Cluster for Enterprise Decision Intelligence Engine
# Port: 5433 (Default to prevent port collision with any existing local instances)
# User: postgres, Database: enterprise_bi, Auth: trust

$ErrorActionPreference = "Stop"

$BASE_DIR = Resolve-Path "$PSScriptRoot\.."
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PG_DATA = Join-Path $BASE_DIR "database\pgdata"
$PG_PORT = 5433
$DB_NAME = "enterprise_bi"
$PG_USER = "postgres"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Initializing PostgreSQL Database for Enterprise BI" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $PG_BIN)) {
    Write-Error "PostgreSQL binaries not found at $PG_BIN. Please verify PostgreSQL 18 installation."
    exit 1
}

# 1. Initialize DB Cluster if data directory does not exist
if (-not (Test-Path $PG_DATA)) {
    Write-Host "[1/4] Initializing new PostgreSQL cluster at $PG_DATA..." -ForegroundColor Yellow
    & "$PG_BIN\initdb.exe" -D $PG_DATA -U $PG_USER -A trust
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to initialize PostgreSQL cluster."
        exit 1
    }
} else {
    Write-Host "[1/4] PostgreSQL cluster already exists at $PG_DATA." -ForegroundColor Green
}

# 2. Check if postgres is already running on port 5433
$running = $false
try {
    $res = & "$PG_BIN\psql.exe" -U $PG_USER -h 127.0.0.1 -p $PG_PORT -d postgres -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $running = $true
        Write-Host "[2/4] PostgreSQL is already running on port $PG_PORT." -ForegroundColor Green
    }
} catch {
    $running = $false
}

if (-not $running) {
    Write-Host "[2/4] Starting PostgreSQL server on port $PG_PORT..." -ForegroundColor Yellow
    $logFile = Join-Path $BASE_DIR "database\pg.log"
    # Start pg_ctl in background
    & "$PG_BIN\pg_ctl.exe" -D $PG_DATA -o "-p $PG_PORT" -l $logFile start
    Start-Sleep -Seconds 3
}

# 3. Create enterprise_bi database if not exists
Write-Host "[3/4] Ensuring database '$DB_NAME' exists..." -ForegroundColor Yellow
$checkDb = & "$PG_BIN\psql.exe" -U $PG_USER -h 127.0.0.1 -p $PG_PORT -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>&1
if ($checkDb -ne "1") {
    & "$PG_BIN\psql.exe" -U $PG_USER -h 127.0.0.1 -p $PG_PORT -d postgres -c "CREATE DATABASE $DB_NAME;"
    Write-Host "Database '$DB_NAME' created." -ForegroundColor Green
} else {
    Write-Host "Database '$DB_NAME' already exists." -ForegroundColor Green
}

# 4. Apply schema and seed data
Write-Host "[4/4] Applying schema and seeding deterministic sample data..." -ForegroundColor Yellow
$schemaFile = Join-Path $BASE_DIR "database\schema.sql"
$seedFile = Join-Path $BASE_DIR "database\seed.sql"

& "$PG_BIN\psql.exe" -U $PG_USER -h 127.0.0.1 -p $PG_PORT -d $DB_NAME -f $schemaFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to execute schema.sql"
    exit 1
}

& "$PG_BIN\psql.exe" -U $PG_USER -h 127.0.0.1 -p $PG_PORT -d $DB_NAME -f $seedFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to execute seed.sql"
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Database setup complete! PostgreSQL running on port $PG_PORT." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
