# SPYRAL OS — Cycle Agent Launcher
# Starts the autonomous development cycle with ChatGPT
# Run this from PowerShell: .\scripts\init-cycle.ps1

Write-Host "=== SPYRAL OS Cycle Agent Launcher ===" -ForegroundColor Cyan
Write-Host ""

$ProjectDir = "C:\spyral-os"
$NodePath = "C:\Program Files\nodejs"
$ScriptPath = "$ProjectDir\scripts\cycle-agent.mjs"
$CycleDir = "$ProjectDir\.cycle"

# Ensure cycle directory exists
if (-not (Test-Path $CycleDir)) {
    New-Item -ItemType Directory -Path $CycleDir -Force | Out-Null
}

# Check if Node.js is available
$nodeExe = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $nodeExe) {
    $env:Path = "$NodePath;$env:Path"
}

Write-Host "Project: $ProjectDir" -ForegroundColor Yellow
Write-Host "Script:  $ScriptPath" -ForegroundColor Yellow
Write-Host ""

# Check if cookies exist
if (-not (Test-Path "$CycleDir\cookies.json")) {
    Write-Host "⚠️  No cookies found at $CycleDir\cookies.json" -ForegroundColor Yellow
    Write-Host "The browser will launch visibly if login is needed." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Starting cycle agent..." -ForegroundColor Green
Write-Host "The agent will:" -ForegroundColor White
Write-Host "  1. Launch a browser to ChatGPT" -ForegroundColor White
Write-Host "  2. Read the latest direction" -ForegroundColor White
Write-Host "  3. Execute development tasks" -ForegroundColor White
Write-Host "  4. Report results back" -ForegroundColor White
Write-Host "  5. Loop autonomously" -ForegroundColor White
Write-Host ""
Write-Host "The agent writes progress to $CycleDir\state.json" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop: Close the browser window or press Ctrl+C here" -ForegroundColor Red
Write-Host ""

# Start the cycle agent
node "$ScriptPath"
