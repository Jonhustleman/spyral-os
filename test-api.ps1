$wc = New-Object System.Net.WebClient
$wc.Headers.Add('Content-Type', 'application/json')

$modes = @('research', 'content', 'consultant', 'navigation', 'command')

foreach ($mode in $modes) {
    try {
        $body = "{`"input`":`"hello`",`"mode`":`"$mode`"}"
        $resp = $wc.UploadString('https://spyral-os.vercel.app/api/working-mind', 'POST', $body)
        Write-Host "--- $mode ---"
        if ($resp.Contains('API_ERROR') -or $resp.Contains('trouble reaching')) {
            Write-Host "❌ FAILED"
            # Extract error message
            if ($resp -match '`"message`":`"([^`"]+)`"') {
                Write-Host "Error: $($matches[1])"
            } else {
                Write-Host $resp.Substring(0, [Math]::Min(500, $resp.Length))
            }
        } else {
            Write-Host "✅ SUCCESS - streaming AI response"
            # Show first chunk content
            if ($resp -match '`"content`":`"([^`"]+)`"') {
                Write-Host "First chunk: $($matches[1])"
            }
        }
        Write-Host ""
    } catch {
        Write-Host "--- $mode --- ERROR: $($_.Exception.Message)"
    }
}
