# Stop all Enterprise Decision Intelligence Engine processes
$BASE_DIR = Resolve-Path "$PSScriptRoot\.."
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PG_DATA = Join-Path $BASE_DIR "database\pgdata"

Write-Host "Stopping all Enterprise BI Services..." -ForegroundColor Yellow

# Kill node servers on 5000 / 3000
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -notlike "*antigravity*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Stop PostgreSQL cleanly
if (Test-Path "$PG_BIN\pg_ctl.exe") {
    & "$PG_BIN\pg_ctl.exe" -D $PG_DATA stop -m fast
}

Write-Host "All services stopped." -ForegroundColor Green
