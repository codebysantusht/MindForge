# MindForge / InterviewIQ Prototype Local Runner
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Starting MindForge Prototype Runner   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "InterviewIQ-Combined\backend"
$FrontendDir = Join-Path $ScriptDir "InterviewIQ-Combined\frontend"

# Check .env in backend
$EnvFile = Join-Path $BackendDir ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "[!] Creating default backend .env file..." -ForegroundColor Yellow
    $RandomSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $EnvContent = @"
GEMINI_API_KEY=
INTERVIEWIQ_SECRET_KEY=$RandomSecret
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GEMINI_MODEL=gemini-2.5-flash
"@
    Set-Content -Path $EnvFile -Value $EnvContent
    Write-Host "[✓] Created .env with random INTERVIEWIQ_SECRET_KEY." -ForegroundColor Green
    Write-Host "[i] Note: Please open $EnvFile to add your GEMINI_API_KEY for AI features." -ForegroundColor Yellow
}

# Start backend in a new process/window
Write-Host "[*] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
$BackendCmd = "cd '$BackendDir'; .\.venv\Scripts\Activate.ps1; uvicorn api:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd

# Wait 2 seconds for backend to start
Start-Sleep -Seconds 2

# Start frontend in a new process/window
Write-Host "[*] Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Cyan
$FrontendCmd = "cd '$FrontendDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd

Write-Host "=========================================" -ForegroundColor Green
Write-Host " Prototype is booting up!" -ForegroundColor Green
Write-Host " - Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host " - Backend API: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host " - API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
