# Start All Services Script for SuperMail + LangGraph
# Run this to start all three servers at once

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "  SuperMail + LangGraph Email Agent Launcher" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend") -or -not (Test-Path "langgraph_server")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Expected structure:" -ForegroundColor Yellow
    Write-Host "  - backend/" -ForegroundColor Yellow
    Write-Host "  - frontend/" -ForegroundColor Yellow
    Write-Host "  - langgraph_server/" -ForegroundColor Yellow
    exit 1
}

Write-Host "This will open 3 terminal windows:" -ForegroundColor Cyan
Write-Host "  1. Django Backend (port 8000)" -ForegroundColor White
Write-Host "  2. React Frontend (port 5173)" -ForegroundColor White
Write-Host "  3. LangGraph Agent (port 8001)" -ForegroundColor White
Write-Host ""

# Check if Google API key is configured
$envFile = "langgraph_server\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "GOOGLE_API_KEY=your_google_api_key_here" -or $envContent -notmatch "GOOGLE_API_KEY=\w+") {
        Write-Host "Warning: Google API key not configured in langgraph_server\.env" -ForegroundColor Yellow
        Write-Host "Get your key from: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "Warning: .env file not found in langgraph_server/" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Press any key to start all services, or Ctrl+C to cancel..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Start Django Backend
Write-Host "[1/3] Starting Django Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Django Backend Server' -ForegroundColor Green; Write-Host 'Running on: http://127.0.0.1:8000' -ForegroundColor Cyan; Write-Host ''; python manage.py runserver"

Start-Sleep -Seconds 2

# Start React Frontend
Write-Host "[2/3] Starting React Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'React Frontend' -ForegroundColor Green; Write-Host 'Running on: http://localhost:5173' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Start-Sleep -Seconds 2

# Start LangGraph Server
Write-Host "[3/3] Starting LangGraph Agent..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\langgraph_server'; Write-Host 'LangGraph Email Agent' -ForegroundColor Green; Write-Host 'Running on: http://localhost:8001' -ForegroundColor Cyan; Write-Host 'API Docs: http://localhost:8001/docs' -ForegroundColor Cyan; Write-Host ''; python main.py"

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor White
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:   http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  AI Agent:  http://localhost:8001" -ForegroundColor Cyan
Write-Host "  API Docs:  http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  Close each terminal window or press Ctrl+C in each" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
