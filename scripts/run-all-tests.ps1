# Run Full Test Suite for Enterprise Decision Intelligence Engine
$ErrorActionPreference = "Stop"
$BASE_DIR = Resolve-Path "$PSScriptRoot\.."

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Executing Comprehensive Test Suite" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Python Analytics Tests
Write-Host "`n[1/4] Running Python Analytics Engine Tests..." -ForegroundColor Yellow
python (Join-Path $BASE_DIR "analytics\test_engine.py")
if ($LASTEXITCODE -ne 0) { Write-Error "Python Analytics tests failed!"; exit 1 }
Write-Host "[PASS] Python Analytics tests PASSED." -ForegroundColor Green

# 2. Node Backend API Tests
Write-Host "`n[2/4] Running Node.js Backend Integration Tests..." -ForegroundColor Yellow
Push-Location (Join-Path $BASE_DIR "apps\backend")
npm test
$bExit = $LASTEXITCODE
Pop-Location
if ($bExit -ne 0) { Write-Error "Backend API tests failed!"; exit 1 }
Write-Host "[PASS] Backend API integration tests PASSED." -ForegroundColor Green

# 3. CSV Upload & Deduplication Tests
Write-Host "`n[3/4] Running CSV Ingestion & Deduplication Tests..." -ForegroundColor Yellow
Push-Location (Join-Path $BASE_DIR "apps\backend")
node tests/upload.test.js
$uExit = $LASTEXITCODE
Pop-Location
if ($uExit -ne 0) { Write-Error "CSV Ingestion tests failed!"; exit 1 }
Write-Host "[PASS] CSV Ingestion and Deduplication tests PASSED." -ForegroundColor Green

# 4. Frontend Production Build Test
Write-Host "`n[4/4] Verifying Frontend Production Build..." -ForegroundColor Yellow
Push-Location (Join-Path $BASE_DIR "apps\frontend")
npm run build
$fExit = $LASTEXITCODE
Pop-Location
if ($fExit -ne 0) { Write-Error "Frontend production build failed!"; exit 1 }
Write-Host "[PASS] Frontend production build PASSED." -ForegroundColor Green

# 5. Restore clean demo baseline
Write-Host "`nRestoring clean seed database state for presentation..." -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File (Join-Path $BASE_DIR "scripts\reset-db.ps1")

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "ALL TEST SUITES PASSED COMPLETELY (100% SUCCESS)!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
