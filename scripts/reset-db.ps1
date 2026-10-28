# Reset Database to initial seeded state
# Use before or after demonstrations

$BASE_DIR = Resolve-Path "$PSScriptRoot\.."
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$PG_PORT = 5433
$DB_NAME = "enterprise_bi"
$PG_USER = "postgres"

Write-Host "Resetting database '$DB_NAME' to clean seed state..." -ForegroundColor Yellow

$schemaFile = Join-Path $BASE_DIR "database\schema.sql"
$seedFile = Join-Path $BASE_DIR "database\seed.sql"

& "$PG_BIN\psql.exe" -U $PG_USER -h 127.0.0.1 -p $PG_PORT -d $DB_NAME -f $schemaFile
& "$PG_BIN\psql.exe" -U $PG_USER -h 127.0.0.1 -p $PG_PORT -d $DB_NAME -f $seedFile

Write-Host "Database reset complete! Baseline sample data restored." -ForegroundColor Green
