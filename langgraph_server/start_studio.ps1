# LangGraph Studio Quick Start
# Run this script to start LangGraph Studio

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "  LangGraph Studio - Email Agent Visualizer" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Check if we're in the langgraph_server directory
if (-not (Test-Path "langgraph.json")) {
    Write-Host "Error: langgraph.json not found" -ForegroundColor Red
    Write-Host "Please run this script from the langgraph_server directory" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  cd langgraph_server" -ForegroundColor White
    Write-Host "  .\start_studio.ps1" -ForegroundColor White
    exit 1
}

# Check if langgraph CLI is installed
try {
    $null = Get-Command langgraph -ErrorAction Stop
} catch {
    Write-Host "LangGraph CLI not found. Installing..." -ForegroundColor Yellow
    pip install -U langgraph-cli
    Write-Host ""
}

# Check environment
Write-Host "Checking configuration..." -ForegroundColor Cyan

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "GOOGLE_API_KEY=AIza") {
        Write-Host "  ✓ Google API Key configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Google API Key may not be configured" -ForegroundColor Yellow
        Write-Host "    Check .env file" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ .env file not found" -ForegroundColor Red
    Write-Host "    Create .env with GOOGLE_API_KEY" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting LangGraph Studio..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Studio Features:" -ForegroundColor White
Write-Host "  🔍 Visual graph debugging" -ForegroundColor Gray
Write-Host "  🎮 Interactive testing" -ForegroundColor Gray
Write-Host "  📊 Real-time state inspection" -ForegroundColor Gray
Write-Host "  ⚡ Hot reload on file changes" -ForegroundColor Gray
Write-Host ""
Write-Host "Once started, visit:" -ForegroundColor Cyan
Write-Host "  http://localhost:8123" -ForegroundColor Yellow -BackgroundColor DarkBlue
Write-Host ""
Write-Host "Press Ctrl+C to stop the studio" -ForegroundColor Gray
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Start LangGraph Studio
langgraph dev
