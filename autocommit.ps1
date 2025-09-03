# Auto-commit script for sales-funnel project
# This script automatically commits and pushes all changes

param(
    [string]$CommitMessage = "",
    [switch]$NoPush = $false
)

Write-Host "Auto-commit: Starting automatic commit process..." -ForegroundColor Yellow

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Check if there are any changes to commit
$hasChanges = git diff-index --quiet HEAD --
if ($LASTEXITCODE -eq 0) {
    Write-Host "No changes to commit" -ForegroundColor Green
    exit 0
}

Write-Host "Found changes, preparing to commit..." -ForegroundColor Green

# Add all changes
git add -A
Write-Host "Added all changes to staging area" -ForegroundColor Cyan

# Create commit message
if ($CommitMessage -eq "") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $CommitMessage = "Auto-commit: Changes at $timestamp"
}

# Commit the changes
git commit -m $CommitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully committed changes" -ForegroundColor Green
    Write-Host "Commit message: $CommitMessage" -ForegroundColor Cyan
} else {
    Write-Host "Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Push to remote if not disabled
if (-not $NoPush) {
    Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
    
    $currentBranch = git branch --show-current
    try {
        git push origin $currentBranch
        Write-Host "Successfully pushed to origin/$currentBranch" -ForegroundColor Green
    } catch {
        Write-Host "Failed to push to remote (this is normal if remote is not configured)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping push (NoPush flag used)" -ForegroundColor Yellow
}

Write-Host "Auto-commit process completed successfully!" -ForegroundColor Green
