# Start Auto-commit Process
# This script starts the autocommit process and runs it continuously

param(
    [int]$IntervalMinutes = 5
)

Write-Host "Starting Auto-commit Process..." -ForegroundColor Green
Write-Host "Will run every $IntervalMinutes minutes" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan

# Function to run autocommit
function Run-AutoCommit {
    try {
        & "$PSScriptRoot\autocommit.ps1"
        Write-Host "Auto-commit completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
    } catch {
        Write-Host "Auto-commit failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Run initial commit
Write-Host "Running initial commit..." -ForegroundColor Yellow
Run-AutoCommit

# Set up continuous loop
while ($true) {
    Write-Host "Waiting $IntervalMinutes minutes until next auto-commit..." -ForegroundColor Yellow
    Start-Sleep -Seconds ($IntervalMinutes * 60)
    Run-AutoCommit
}
