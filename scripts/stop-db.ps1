# Stop PostgreSQL database cluster
$BASE_DIR = Resolve-Path "$PSScriptRoot\.."
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PG_DATA = Join-Path $BASE_DIR "database\pgdata"

Write-Host "Stopping PostgreSQL database..." -ForegroundColor Yellow
& "$PG_BIN\pg_ctl.exe" -D $PG_DATA stop -m fast
Write-Host "PostgreSQL stopped." -ForegroundColor Green
