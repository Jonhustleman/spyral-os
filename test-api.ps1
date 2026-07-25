$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Content-Type', 'application/json')

# Test command mode and show full response
Write-Host "=== COMMAND (FULL) ==="
$body = "{`"input`":`"hello`",`"mode`":`"command`"}"
try {
    $resp = $wc.UploadString('https://spyral-os.vercel.app/api/working-mind', 'POST', $body)
    Write-Host $resp
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
