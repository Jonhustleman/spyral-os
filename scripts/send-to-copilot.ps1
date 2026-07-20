# Send "ask chatgpt for direction" to the VS Code Copilot chat
# Uses keyboard simulation to type into the chat input and submit

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient

# Wait a moment for VS Code to be ready
Start-Sleep -Milliseconds 300

# Find the VS Code window and activate it
try {
    $vsCodeProcess = Get-Process -Name "Code" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($vsCodeProcess) {
        $vsCodeProcess.Refresh()
        $hwnd = $vsCodeProcess.MainWindowHandle
        if ($hwnd -ne 0) {
            # Activate the VS Code window
            $null = [System.Windows.Forms.SendKeys]::SendWait("^{F1}")  # Ctrl+F1 or similar to ensure VS Code is active
            Start-Sleep -Milliseconds 200
        }
    }
} catch {
    Write-Host "Could not find VS Code window: $_"
}

# Open/focus the Copilot chat (Ctrl+Shift+I is default shortcut)
[System.Windows.Forms.SendKeys]::SendWait("^+i")
Start-Sleep -Milliseconds 1000

# Type the message
[System.Windows.Forms.SendKeys]::SendWait("ask chatgpt for direction")
Start-Sleep -Milliseconds 300

# Send it (Enter)
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

Write-Host "Message sent to Copilot chat!"
