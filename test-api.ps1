$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Content-Type', 'application/json')

# Test research mode - full response
Write-Host "=== RESEARCH (FULL) ==="
$body = "{`"input`":`"test`",`"mode`":`"research`"}"
try {
    $resp = $wc.UploadString('https://spyral-os.vercel.app/api/working-mind', 'POST', $body)
    Write-Host $resp
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== COMMAND (FULL) ==="
$body2 = "{`"input`":`"test`",`"mode`":`"command`"}"
try {
    $resp2 = $wc.UploadString('https://spyral-os.vercel.app/api/working-mind', 'POST', $body2)
    Write-Host $resp2
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
