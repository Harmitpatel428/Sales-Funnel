# Auto-Commit Feature

This project includes an automatic commit system that will automatically commit and push your changes to Git.

## How to Use

### Option 1: Manual Start (Recommended)
1. Double-click `start-autocommit.bat` or run:
   ```
   powershell -ExecutionPolicy Bypass -File start-autocommit.ps1
   ```

### Option 2: Add to Windows Startup
1. Press `Win + R` and type `shell:startup`
2. Create a shortcut to `start-autocommit.bat` in the startup folder
3. The autocommit will start automatically when you log in

### Option 3: Run Once
To commit current changes once:
```
powershell -ExecutionPolicy Bypass -File autocommit.ps1
```

## What It Does

- ✅ **Automatically commits** all changes every 5 minutes
- ✅ **Automatically pushes** to remote repository
- ✅ **Creates timestamped** commit messages
- ✅ **Runs continuously** until stopped
- ✅ **Handles errors** gracefully

## Files Created

- `autocommit.ps1` - Main autocommit script
- `start-autocommit.ps1` - Continuous autocommit runner
- `start-autocommit.bat` - Easy-to-run batch file
- `setup-autocommit.ps1` - Task Scheduler setup (requires admin)

## Stopping Auto-Commit

Press `Ctrl + C` in the PowerShell window to stop the autocommit process.

## Customization

To change the interval (default: 5 minutes):
```
powershell -ExecutionPolicy Bypass -File start-autocommit.ps1 -IntervalMinutes 10
```

## Troubleshooting

- **Permission Error**: Run PowerShell as Administrator
- **Git Not Found**: Make sure Git is installed and in PATH
- **Remote Push Fails**: Check your Git remote configuration

## Status

🟢 **Auto-commit is now ON and working!**
