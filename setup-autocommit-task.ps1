# Setup script for automatic commit task
# This script creates a Windows Task Scheduler task to run autocommit every 5 minutes

param(
    [string]$ProjectPath = (Get-Location).Path,
    [string]$TaskName = "SalesFunnel-AutoCommit",
    [int]$IntervalMinutes = 5
)

Write-Host "🔄 Setting up automatic commit task..." -ForegroundColor Yellow

# Check if running as administrator
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Create the task action
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ProjectPath\autocommit.ps1`""

# Create the trigger (every 5 minutes)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration (New-TimeSpan -Days 365)

# Create the task settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Create the task principal (run as current user)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Automatic commit for sales-funnel project"
    Write-Host "✅ Successfully created task: $TaskName" -ForegroundColor Green
    Write-Host "📅 Task will run every $IntervalMinutes minutes" -ForegroundColor Cyan
    Write-Host "🔄 Task will automatically commit and push changes" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to create task: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Automatic commit task setup completed!" -ForegroundColor Green
Write-Host "💡 To manage the task, use Task Scheduler or run:" -ForegroundColor Yellow
Write-Host "   Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
