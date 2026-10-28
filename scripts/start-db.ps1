# Start PostgreSQL database cluster
$BASE_DIR = Resolve-Path "$PSScriptRoot\.."
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PG_DATA = Join-Path $BASE_DIR "database\pgdata"
$PG_PORT = 5433

Write-Host "Starting PostgreSQL database on port $PG_PORT..." -ForegroundColor Yellow
$logFile = Join-Path $BASE_DIR "database\pg.log"
& "$PG_BIN\pg_ctl.exe" -D $PG_DATA -o "-p $PG_PORT" -l $logFile start
Write-Host "PostgreSQL started on port $PG_PORT." -ForegroundColor Green
